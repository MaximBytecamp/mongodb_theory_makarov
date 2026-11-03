// Модуль 7, глава 7.4: датчики температуры в холодильниках с вакцинами.
// Пересоздаёт коллекцию временных рядов sandbox.fridge_temps.
// Два холодильника, замер раз в 10 минут за сутки 2026-11-02: 2 × 144 = 288 замеров.
// Числа задаются формулой, без случайности, чтобы выводы в книге повторялись.

const sb = db.getSiblingDB("sandbox");
sb.fridge_temps.drop();
sb.createCollection("fridge_temps", {
  timeseries: { timeField: "ts", metaField: "sensor", granularity: "minutes" },
});

const start = Date.UTC(2026, 10, 2, 0, 0, 0);
const docs = [];
for (let i = 0; i < 144; i++) {
  const ts = new Date(start + i * 10 * 60 * 1000);
  // Холодильник F1 работает ровно: 4.0…5.4 °C.
  const t1 = 4.0 + ((i * 7) % 15) / 10;
  // Холодильник F2 в 14:00–15:20 открыт при разгрузке: температура поднимается до 11 °C.
  let t2 = 4.5 + ((i * 5) % 11) / 10;
  if (i >= 84 && i <= 92) t2 = 6.0 + (i - 84) * 0.625;
  docs.push({ ts: ts, sensor: { fridge: "F1", room: "прививочный" }, c: Math.round(t1 * 10) / 10 });
  docs.push({ ts: ts, sensor: { fridge: "F2", room: "склад" }, c: Math.round(t2 * 10) / 10 });
}
sb.fridge_temps.insertMany(docs);
print("readings", sb.fridge_temps.countDocuments());
