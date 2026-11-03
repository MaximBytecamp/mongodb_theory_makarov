// Модуль 7, глава 7.5: заявки сервисного центра со статусами и историей этапов.
// Пересоздаёт sandbox.repair_requests. «Сегодня» в главе — 2026-11-03.

const sb = db.getSiblingDB("sandbox");
sb.repair_requests.drop();

const T = (s) => new Date(s + ":00Z");
const step = (status, from, to) => (to ? { status: status, from: T(from), to: T(to) } : { status: status, from: T(from) });

sb.repair_requests.insertMany([
  { _id: "r-301", device: { kind: "ноутбук", model: "Lenovo ThinkPad E14", serial: "PF3K2X" },
    complaint: "не включается", status: "выдан",
    history: [step("принят", "2026-10-20T10:00", "2026-10-20T15:00"),
              step("диагностика", "2026-10-20T15:00", "2026-10-21T12:00"),
              step("ждёт запчасть", "2026-10-21T12:00", "2026-10-27T11:00"),
              step("ремонт", "2026-10-27T11:00", "2026-10-27T17:00"),
              step("выдан", "2026-10-28T10:00")] },
  { _id: "r-302", device: { kind: "смартфон", model: "Samsung Galaxy A54", imei: "35-209900-176148-1" },
    complaint: "разбит экран", status: "выдан",
    history: [step("принят", "2026-10-22T11:00", "2026-10-22T12:00"),
              step("диагностика", "2026-10-22T12:00", "2026-10-22T14:00"),
              step("ремонт", "2026-10-22T14:00", "2026-10-22T18:00"),
              step("выдан", "2026-10-23T09:00")] },
  { _id: "r-303", device: { kind: "кофемашина", model: "DeLonghi ECAM 22.110", water_hardness: "жёсткая" },
    complaint: "течёт вода", status: "ждёт запчасть",
    history: [step("принят", "2026-10-24T10:00", "2026-10-24T16:00"),
              step("диагностика", "2026-10-24T16:00", "2026-10-26T10:00"),
              step("ждёт запчасть", "2026-10-26T10:00")] },
  { _id: "r-304", device: { kind: "ноутбук", model: "ASUS VivoBook 15", serial: "N3NRKD" },
    complaint: "перегревается", status: "ремонт",
    history: [step("принят", "2026-10-30T09:00", "2026-10-30T10:00"),
              step("диагностика", "2026-10-30T10:00", "2026-10-31T16:00"),
              step("ремонт", "2026-10-31T16:00")] },
  { _id: "r-305", device: { kind: "смартфон", model: "Apple iPhone 13", imei: "35-407115-883301-6" },
    complaint: "не заряжается", status: "ждёт запчасть",
    history: [step("принят", "2026-10-27T13:00", "2026-10-27T14:00"),
              step("диагностика", "2026-10-27T14:00", "2026-10-28T11:00"),
              step("ждёт запчасть", "2026-10-28T11:00")] },
  { _id: "r-306", device: { kind: "стиральная машина", model: "Indesit IWSB 5085", visit_address: "ул. Лесная, 4" },
    complaint: "не сливает воду", status: "диагностика",
    history: [step("принят", "2026-11-02T09:30", "2026-11-02T10:00"),
              step("диагностика", "2026-11-02T10:00")] },
]);

sb.repair_requests.createIndex({ status: 1 });
print("requests", sb.repair_requests.countDocuments());
