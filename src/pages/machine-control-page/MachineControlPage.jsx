import { useEffect, useState } from "react";
import MachineControls from "../../components/machine-controls/MachineControls";
import MachineStatus from "../../components/machine-status/MachineStatus";
import ColorSelect from "../../components/color-select/ColorSelect";
import MachineBlocks from "../../components/machine-blocks/MachineBlocks";
import Notification from "../../components/notifications/Notifications";
import { COLORS } from "../../data/colors";
import { MACHINE_BLOCKS } from "../../data/machineBlocks";
import {
  startMachine,
  stopMachine,
  setMachineColor,
  getMachineStatus,
} from "../../api/machineAPI";
import MachineScheme from "../../components/machine-scheme/MachineScheme";
import SystemInfo from "../../components/system-info/SystemInfo";

function MachineControlPage() {
  const [machineStatus, setMachineStatus] = useState("ОСТАНОВЛЕНА");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, type = "info") => {
    const id = Date.now() + Math.random();

    setNotifications((prev) => [{ id, text, type }, ...prev]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getMachineStatus();

        setMachineStatus(data?.is_enabled ? "ЗАПУЩЕНА" : "ОСТАНОВЛЕНА");

        if (data?.target_color) {
          setSelectedColor(data.target_color);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadSettings();
  }, []);

  const handleStartClick = async () => {
    try {
      const data = await startMachine();

      setMachineStatus(data?.is_enabled ? "ЗАПУЩЕНА" : "ОСТАНОВЛЕНА");

      if (data?.target_color) {
        setSelectedColor(data.target_color);
      }

      addNotification("Система запущена", "success");
    } catch (error) {
      console.error(error);
      addNotification(error.message || "Ошибка запуска системы", "error");
    }
  };

  const handleStopClick = async () => {
    try {
      const data = await stopMachine();

      setMachineStatus(data?.is_enabled ? "ЗАПУЩЕНА" : "ОСТАНОВЛЕНА");

      if (data?.target_color) {
        setSelectedColor(data.target_color);
      }

      addNotification("Система остановлена", "info");
    } catch (error) {
      console.error(error);
      addNotification(error.message || "Ошибка остановки системы", "error");
    }
  };

  const handleColorChange = async (event) => {
    const nextColor = event.target.value;

    try {
      const data = await setMachineColor(nextColor);
      const updatedColor = data?.target_color ?? nextColor;

      setSelectedColor(updatedColor);

      const selectedOption = COLORS.find(
        (color) => color.value === updatedColor,
      );

      addNotification(
        `Выбран целевой цвет: ${selectedOption?.label ?? updatedColor}`,
        "info",
      );
    } catch (error) {
      console.error(error);
      addNotification(error.message || "Ошибка выбора цвета", "error");
    }
  };

  return (
    <div className="wrapper">
      <main className="content">
        <div className="container">
          <div className="machine-control-page">
            <section className="machine-control-page__toolbar">
              <MachineControls
                onStart={handleStartClick}
                onStop={handleStopClick}
              />

              <div className="machine-control-page__settings">
                <MachineStatus status={machineStatus} />

                <ColorSelect
                  label="Целевой цвет:"
                  value={selectedColor}
                  options={COLORS}
                  onChange={handleColorChange}
                />
              </div>
            </section>

            <section className="machine-control-page__scheme">
              <MachineScheme />
            </section>

            <section className="machine-control-page__content">
              <MachineBlocks blocks={MACHINE_BLOCKS} />
              <SystemInfo />
            </section>

            <Notification
              notifications={notifications}
              onClose={removeNotification}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default MachineControlPage;
