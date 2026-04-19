import CollapsibleSection from "../CollapsibleSection";

function SystemInfo({
  machineStatus = "ОСТАНОВЛЕНА",
  selectedColor = "—",
  schemeState = {},
  schemeInfo = {},
  stats = {},
}) {
  const info = {
    currentStage: schemeInfo.currentStage || "—",
    currentCapColor: schemeInfo.currentCapColor || "—",
    detectedColor: schemeInfo.detectedColor || "—",
    orientation: schemeInfo.orientation || "—",
  };

  const viewState = {
    message: schemeState.message || "—",
    hopper: schemeState.hopper || "—",
    conveyor: schemeState.conveyor || "—",
    pusher: schemeState.pusher || "—",
    vision: schemeState.vision || "—",
  };

  const statistics = {
    total_processed: stats.total_processed ?? 0,
    success_count: stats.success_count ?? 0,
    fail_count: stats.fail_count ?? 0,
    success_rate: stats.success_rate ?? 0,
  };

  const alerts = [];

  if (machineStatus !== "ЗАПУЩЕНА") {
    alerts.push("Линия остановлена");
  }

  if (schemeState.hopper === "jam") {
    alerts.push("Забился входной блок");
  }

  if (schemeState.conveyor === "broken") {
    alerts.push("Сбой конвейера");
  }

  if (schemeState.pusher === "broken") {
    alerts.push("Сбой толкателя");
  }

  if (schemeState.vision === "broken") {
    alerts.push("Ошибка блока машинного зрения");
  }

  return (
    <section className="system-info">
      <CollapsibleSection
        title="Показатели"
        className="system-info__block system-info__block--stats"
        headerClassName="system-info__header"
        titleClassName="system-info__title"
        toggleClassName="system-info__toggle"
        collapsedClassName="system-info__block--collapsed"
        defaultOpen
      >
        <ul className="system-info__list">
          <li className="system-info__item">
            <span className="system-info__label">Статус машины:</span>
            <span className="system-info__value">{machineStatus}</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Целевой цвет:</span>
            <span className="system-info__value">{selectedColor}</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Режим схемы:</span>
            <span className="system-info__value">{viewState.message}</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Входной блок:</span>
            <span className="system-info__value">{viewState.hopper}</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Конвейер:</span>
            <span className="system-info__value">{viewState.conveyor}</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Толкатель:</span>
            <span className="system-info__value">{viewState.pusher}</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Камера:</span>
            <span className="system-info__value">{viewState.vision}</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Текущий этап:</span>
            <span className="system-info__value">{info.currentStage}</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Текущая крышка:</span>
            <span className="system-info__value">{info.currentCapColor}</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Ориентация:</span>
            <span className="system-info__value">{info.orientation}</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Распознанный цвет:</span>
            <span className="system-info__value">{info.detectedColor}</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Обработано крышек:</span>
            <span className="system-info__value">
              {statistics.total_processed}
            </span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Успешность:</span>
            <span className="system-info__value">
              {statistics.success_rate}%
            </span>
          </li>
        </ul>
      </CollapsibleSection>

    </section>
  );
}

export default SystemInfo;
