function Notifications({ notifications, onClose }) {
  return (
    <div className="notifications">
      {notifications.map((item) => (
        <div
          key={item.id}
          className={`notifications__item notifications__item--${item.type}`}
        >
          <span className="notifications__text">{item.text}</span>

          <button
            className="notifications__close"
            type="button"
            onClick={() => onClose(item.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default Notifications;