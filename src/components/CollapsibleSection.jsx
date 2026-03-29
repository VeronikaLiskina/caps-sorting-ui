import { useState } from "react";

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  className = "",
  headerClassName = "",
  titleClassName = "",
  toggleClassName = "",
  collapsedClassName = "",
  contentClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const sectionClassName = [
    "collapsible-section",
    className,
    !isOpen ? "collapsible-section--collapsed" : "",
    !isOpen ? collapsedClassName : "",
  ]
    .filter(Boolean)
    .join(" ");

  const headerClasses = ["collapsible-section__header", headerClassName]
    .filter(Boolean)
    .join(" ");

  const titleClasses = ["collapsible-section__title", titleClassName]
    .filter(Boolean)
    .join(" ");

  const toggleClasses = ["collapsible-section__toggle", toggleClassName]
    .filter(Boolean)
    .join(" ");

  const contentClasses = ["collapsible-section__content", contentClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={sectionClassName}>
      <div className={headerClasses}>
        <h2 className={titleClasses}>{title}</h2>

        <button
          className={toggleClasses}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? "Свернуть" : "Развернуть"}
        </button>
      </div>

      {isOpen && <div className={contentClasses}>{children}</div>}
    </section>
  );
}

export default CollapsibleSection;
