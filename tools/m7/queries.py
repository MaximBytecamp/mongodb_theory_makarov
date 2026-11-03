"""Запросы модуля 7 в mongosh. Порядок внутри главы — порядок прогона."""


def Q(ch, name, caption, code):
    return {"ch": ch, "name": name, "caption": caption, "code": code}


QUERIES = [
    # ── 7.2 Ветеринарная клиника ────────────────────────────────────────
    Q("7.2", "card", "карточка кошки Барсик", """
db.vet_patients.findOne({ _id: "p-001" })
"""),
    Q("7.2", "species", "у каждого вида свой блок полей", """
db.vet_patients.find(
  {},
  { _id: 0, name: 1, species: 1, cat: 1, dog: 1, bird: 1, reptile: 1, rabbit: 1 }
)
"""),
    Q("7.2", "visit", "приём собаки Лайма с кривой глюкозы", """
db.vet_visits.findOne({ _id: "v-1004" })
"""),
    Q("7.2", "screen", "экран врача: карточка, владелец и два последних приёма", """
db.vet_patients.aggregate([
  { $match: { _id: "p-001" } },
  { $lookup: { from: "vet_owners", localField: "owner_id", foreignField: "_id", as: "owner" } },
  { $lookup: {
      from: "vet_visits",
      let: { pid: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$patient_id", "$$pid"] } } },
        { $sort: { date: -1 } },
        { $limit: 2 },
        { $project: { _id: 0, date: 1, reason: 1, labs: 1 } }
      ],
      as: "last_visits"
  } },
  { $project: {
      name: 1, species: 1, allergies: 1, chronic: 1,
      owner: { $first: "$owner.name" }, phone: { $first: "$owner.phone" },
      last_visits: 1
  } }
])
"""),
    Q("7.2", "allergy", "перед назначением: у кого аллергия на пенициллин", """
db.vet_patients.find({ allergies: "пенициллин" }, { name: 1, species: 1, allergies: 1 })
"""),
    Q("7.2", "chronic", "все пациенты с хронической болезнью почек", """
db.vet_patients.find(
  { "chronic.code": "CKD" },
  { _id: 0, name: 1, species: 1, "chronic.stage": 1 }
)
"""),
    Q("7.2", "trend", "динамика креатинина и SDMA у Барсика", """
db.vet_visits.find(
  { patient_id: "p-001", "labs.creatinine": { $exists: true } },
  { _id: 0, date: 1, "labs.creatinine": 1, "labs.sdma": 1 }
).sort({ date: 1 })
"""),
    Q("7.2", "remind", "кому звонить: прививка просрочена на 3 ноября 2026", """
db.vet_patients.aggregate([
  { $match: { "vaccinations.next": { $lt: ISODate("2026-11-03") } } },
  { $lookup: { from: "vet_owners", localField: "owner_id", foreignField: "_id", as: "owner" } },
  { $unwind: "$owner" },
  { $match: { "owner.consent": true } },
  { $project: {
      _id: 0, name: 1, owner: "$owner.name", phone: "$owner.phone",
      overdue: { $filter: {
        input: "$vaccinations",
        cond: { $lt: ["$$this.next", ISODate("2026-11-03")] }
      } }
  } },
  { $project: { name: 1, owner: 1, phone: 1, "overdue.vaccine": 1, "overdue.next": 1 } }
])
"""),
    Q("7.2", "month", "приёмы октября по диагнозам: что закупать", """
db.vet_visits.aggregate([
  { $match: { date: { $gte: ISODate("2026-10-01"), $lt: ISODate("2026-11-01") } } },
  { $unwind: "$diagnoses" },
  { $group: { _id: "$diagnoses", visits: { $sum: 1 } } },
  { $lookup: { from: "vet_diagnoses", localField: "_id", foreignField: "_id", as: "d" } },
  { $project: { _id: 0, code: "$_id", title: { $first: "$d.title" }, visits: 1 } },
  { $sort: { visits: -1, code: 1 } }
])
"""),
    Q("7.2", "newlab", "новый анализ без изменения схемы", """
db.vet_visits.insertOne({
  _id: "v-1009", patient_id: "p-002", date: ISODate("2026-11-03"), doctor: "Орлова",
  reason: "рвота, отказ от корма",
  labs: { lipase_fpl: 5.9, glucose: 6.4 },
  ultrasound: { pancreas: "увеличена, гипоэхогенна" },
  diagnoses: [], prescriptions: ["инфузия", "противорвотное"]
})

db.vet_visits.countDocuments({ "labs.lipase_fpl": { $exists: true } })
"""),
    Q("7.2", "rules", "правила для карточки: без вида и владельца не сохранить", """
db.runCommand({
  collMod: "vet_patients",
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["name", "species", "owner_id"],
    properties: {
      species: { enum: ["кошка", "собака", "попугай", "черепаха", "кролик", "хорёк"] },
      allergies: { bsonType: "array", items: { bsonType: "string" } }
    }
  } }
})

try {
  db.vet_patients.insertOne({ _id: "p-008", name: "Рыжик", owner_id: "o-04" })
} catch (e) {
  print(e.message)
  printjson(e.errInfo.details.schemaRulesNotSatisfied)
}
"""),
    Q("7.2", "chip", "поиск по номеру чипа: уникальный индекс только для чипированных", """
db.vet_patients.createIndex(
  { chip: 1 },
  { unique: true, partialFilterExpression: { chip: { $exists: true } } }
)

db.vet_patients.find({ chip: "643094100654321" }, { name: 1, species: 1 })
"""),

    # ── 7.3 Каталоги и анкеты ───────────────────────────────────────────
    Q("7.3", "two", "два товара из разных категорий", """
db.zoo_catalog.find({ _id: { $in: ["z-02", "z-07"] } })
"""),
    Q("7.3", "attr", "корм для собак весом от 10 кг", """
db.zoo_catalog.find(
  {
    category: "корм",
    attrs: { $all: [
      { $elemMatch: { k: "вид", v: "собака" } },
      { $elemMatch: { k: "вес", v: { $gte: 10 } } }
    ] }
  },
  { _id: 0, title: 1, price: 1 }
)
"""),
    Q("7.3", "plan", "какой план выбрал сервер", """
db.zoo_catalog.find({ attrs: { $elemMatch: { k: "вес", v: { $gte: 10 } } } })
  .explain("executionStats").queryPlanner.winningPlan.inputStage.stage
"""),
    Q("7.3", "filters", "панель фильтров для вида «кошка»", """
db.zoo_catalog.aggregate([
  { $match: { attrs: { $elemMatch: { k: "вид", v: "кошка" } } } },
  { $facet: {
      categories: [
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } }
      ],
      attributes: [
        { $unwind: "$attrs" },
        { $match: { "attrs.k": { $ne: "вид" } } },
        { $group: { _id: "$attrs.k", values: { $addToSet: "$attrs.v" } } },
        { $project: { values: { $sortArray: { input: "$values", sortBy: 1 } } } },
        { $sort: { _id: 1 } }
      ]
  } }
])
"""),
    Q("7.3", "forms", "анкеты на стерилизацию: разные версии формы", """
db.zoo_forms.find(
  { form: "запись на стерилизацию" },
  { _id: 0, version: 1, answers: 1 }
)
"""),
    Q("7.3", "formq", "кто ел позже, чем за 12 часов: вопрос есть не во всех анкетах", """
db.zoo_forms.find(
  { "answers.ate_last": "утром" },
  { _id: 1, "answers.species": 1, "answers.ate_last": 1 }
)
"""),

    # ── 7.4 Потоки событий ──────────────────────────────────────────────
    Q("7.4", "one", "один замер датчика", """
db.fridge_temps.findOne({ "sensor.fridge": "F2" }, { _id: 0 })
"""),
    Q("7.4", "buckets", "288 замеров хранятся в нескольких корзинах", """
db.fridge_temps.countDocuments()

db.getCollection("system.buckets.fridge_temps").countDocuments()
"""),
    Q("7.4", "bucket", "что внутри одной корзины", """
db.getCollection("system.buckets.fridge_temps").aggregate([
  { $match: { "meta.fridge": "F1" } },
  { $sort: { "control.min.ts": 1 } },
  { $limit: 1 },
  { $project: {
      _id: 0, meta: 1,
      "control.min.ts": 1, "control.min.c": 1,
      "control.max.ts": 1, "control.max.c": 1
  } }
])
"""),
    Q("7.4", "excursion", "выход за 8 °C: замеры холодильника F2", """
db.fridge_temps.find(
  { "sensor.fridge": "F2", c: { $gt: 8 } },
  { _id: 0, ts: 1, c: 1 }
).sort({ ts: 1 })
"""),
    Q("7.4", "hourly", "суточная сводка по часам: только часы с превышением", """
db.fridge_temps.aggregate([
  { $group: {
      _id: { fridge: "$sensor.fridge", hour: { $dateTrunc: { date: "$ts", unit: "hour" } } },
      min: { $min: "$c" }, max: { $max: "$c" }, n: { $sum: 1 }
  } },
  { $match: { max: { $gt: 8 } } },
  { $sort: { "_id.hour": 1 } }
])
"""),
    Q("7.4", "daily", "сутки по каждому холодильнику", """
db.fridge_temps.aggregate([
  { $group: {
      _id: "$sensor.fridge",
      readings: { $sum: 1 },
      min: { $min: "$c" }, max: { $max: "$c" },
      avg: { $avg: "$c" },
      over8: { $sum: { $cond: [{ $gt: ["$c", 8] }, 1, 0] } }
  } },
  { $set: { avg: { $round: ["$avg", 2] } } },
  { $sort: { _id: 1 } }
])
"""),

    # ── 7.5 Бизнес-процессы ─────────────────────────────────────────────
    Q("7.5", "one", "заявка с историей этапов", """
db.repair_requests.findOne({ _id: "r-301" })
"""),
    Q("7.5", "board", "доска заявок: сколько в каждом статусе", """
db.repair_requests.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } },
  { $sort: { count: -1, _id: 1 } }
])
"""),
    Q("7.5", "stuck", "заявки, которые стоят на текущем этапе дольше 3 суток", """
db.repair_requests.aggregate([
  { $match: { status: { $ne: "выдан" } } },
  { $set: { current: { $last: "$history" } } },
  { $set: { days: { $dateDiff: {
      startDate: "$current.from", endDate: ISODate("2026-11-03T09:00:00Z"), unit: "day"
  } } } },
  { $match: { days: { $gt: 3 } } },
  { $project: { _id: 1, model: "$device.model", status: 1, since: "$current.from", days: 1 } },
  { $sort: { days: -1 } }
])
"""),
    Q("7.5", "bottleneck", "где теряется время: средняя длительность этапа в часах", """
db.repair_requests.aggregate([
  { $unwind: "$history" },
  { $match: { "history.status": { $ne: "выдан" } } },
  { $group: {
      _id: "$history.status",
      steps: { $sum: 1 },
      avg_hours: { $avg: { $dateDiff: {
        startDate: "$history.from",
        endDate: { $ifNull: ["$history.to", ISODate("2026-11-03T09:00:00Z")] },
        unit: "hour"
      } } }
  } },
  { $set: { avg_hours: { $round: ["$avg_hours", 1] } } },
  { $sort: { avg_hours: -1 } }
])
"""),
    Q("7.5", "move", "переход на следующий этап — одна операция над одним документом", """
db.repair_requests.updateOne(
  { _id: "r-306", status: "диагностика" },
  [
    { $set: {
        status: "ремонт",
        history: { $concatArrays: [
          { $map: {
              input: "$history",
              in: { $cond: [
                { $eq: ["$$this.status", "диагностика"] },
                { $mergeObjects: ["$$this", { to: ISODate("2026-11-03T12:00:00Z") }] },
                "$$this"
              ] }
          } },
          [ { status: "ремонт", from: ISODate("2026-11-03T12:00:00Z") } ]
        ] }
    } }
  ]
)

db.repair_requests.findOne({ _id: "r-306" }, { _id: 0, status: 1, history: 1 })
"""),
]
