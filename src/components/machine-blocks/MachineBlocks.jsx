import CollapsibleSection from "../CollapsibleSection";
function MachineBlocks({ blocks }) {
  return (
    <CollapsibleSection
      title="Блоки машины"
      className="machine-blocks"
      headerClassName="machine-blocks__header"
      titleClassName="machine-blocks__title"
      toggleClassName="machine-blocks__toggle section-toggle"
      collapsedClassName="machine-blocks--collapsed"
    >
      <ul className="machine-blocks__list">
        {blocks.map((block) => (
          <li className="machine-blocks__item" key={block.id}>
            <span className="machine-blocks__name">{block.name}</span>
            <span className="machine-blocks__status">{block.status}</span>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}

export default MachineBlocks;