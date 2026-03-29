import CollapsibleSection from "../CollapsibleSection";

function SystemInfo() {
  return (
    <section className="system-info">
      <CollapsibleSection
        title="Показатели"
        className="system-info__block system-info__block--stats"
        headerClassName="system-info__header"
        titleClassName="system-info__title"
        toggleClassName="system-info__toggle"
        collapsedClassName="system-info__block--collapsed"
        defaultOpen={false}
      >
        <ul className="system-info__list">
          <li className="system-info__item">
            <span className="system-info__label">Обработано крышек:</span>
            <span className="system-info__value">0</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Целевого цвета:</span>
            <span className="system-info__value">0</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Отбраковано:</span>
            <span className="system-info__value">0</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Текущая крышка:</span>
            <span className="system-info__value">—</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Ориентация:</span>
            <span className="system-info__value">—</span>
          </li>

          <li className="system-info__item">
            <span className="system-info__label">Распознанный цвет:</span>
            <span className="system-info__value">—</span>
          </li>
        </ul>
      </CollapsibleSection>
    </section>
  );
}

export default SystemInfo;