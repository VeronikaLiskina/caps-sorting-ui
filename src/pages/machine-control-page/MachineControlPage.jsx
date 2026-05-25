import { useCallback, useEffect, useMemo, useState } from "react";
import MachineControls from "../../components/machine-controls/MachineControls";
import MachineStatus from "../../components/machine-status/MachineStatus";
import ColorSelect from "../../components/color-select/ColorSelect";
import MachineBlocks from "../../components/machine-blocks/MachineBlocks";
import Notifications from "../../components/notifications/Notifications";
import MachineScheme from "../../components/machine-scheme/MachineScheme";
import SystemInfo from "../../components/system-info/SystemInfo";
import { COLORS } from "../../data/colors";
import { MACHINE_BLOCKS } from "../../data/machineBlocks";
import {
  getMachineStatus,
  setMachineColor,
  startMachine,
  stopMachine,
} from "../../api/machineAPI";

function createIdleSchemeState(color = "blue") {
  return {
    mode: "idle",
    hopper: "closed",
    conveyor: "stopped",
    pusher: "idle",
    vision: "idle",
    selectedColor: color,
    detectedColor: null,
    message: "Система остановлена",
  };
}

function createRunningSchemeState(color = "blue") {
  return {
    mode: "running",
    hopper: "open",
    conveyor: "moving",
    pusher: "idle",
    vision: "checking",
    selectedColor: color,
    detectedColor: null,
    message: "Идёт сортировка крышек",
  };
}

function MachineControlPage() {
  const [machineStatus, setMachineStatus] = useState("ОСТАНОВЛЕНА");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [schemeInfo, setSchemeInfo] = useState({
    currentStage: "Ожидание запуска",
    currentCapColor: "—",
    detectedColor: "—",
    orientation: "—",
  });

  const [schemeState, setSchemeState] = useState(createIdleSchemeState("blue"));

  const addNotification = useCallback((text, type = "info") => {
    const id = Date.now() + Math.random();

    setNotifications((prev) => [{ id, text, type }, ...prev]);

    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const applyMachineState = useCallback((data) => {
    const nextColor = data?.target_color ?? "blue";
    const isEnabled = Boolean(data?.is_enabled);

    setSelectedColor(nextColor);
    setMachineStatus(isEnabled ? "ЗАПУЩЕНА" : "ОСТАНОВЛЕНА");
    setSchemeState(
      isEnabled
        ? createRunningSchemeState(nextColor)
        : createIdleSchemeState(nextColor),
    );
  }, []);

  const syncSettings = useCallback(async () => {
    try {
      const data = await getMachineStatus();
      applyMachineState(data);
    } catch (error) {
      console.error(error);
      addNotification("Не удалось получить состояние системы", "error");
    }
  }, [addNotification, applyMachineState]);

  useEffect(() => {
    syncSettings();
  }, [syncSettings]);

  const handleStartClick = async () => {
    if (isLoading || machineStatus === "ЗАПУЩЕНА") {
      return;
    }

    try {
      setIsLoading(true);

      const data = await startMachine();
      const nextColor = data?.target_color ?? selectedColor;

      setSelectedColor(nextColor);
      setMachineStatus("ЗАПУЩЕНА");
      setSchemeState(createRunningSchemeState(nextColor));

      addNotification("Система запущена", "success");
    } catch (error) {
      console.error(error);
      addNotification(error.message || "Ошибка запуска системы", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopClick = async () => {
    if (isLoading || machineStatus === "ОСТАНОВЛЕНА") {
      return;
    }

    try {
      setIsLoading(true);

      const data = await stopMachine();
      const nextColor = data?.target_color ?? selectedColor;

      setSelectedColor(nextColor);
      setMachineStatus("ОСТАНОВЛЕНА");
      setSchemeState(createIdleSchemeState(nextColor));

      addNotification("Система остановлена", "info");
    } catch (error) {
      console.error(error);
      addNotification(error.message || "Ошибка остановки системы", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorChange = async (event) => {
    const nextColor = event.target.value;

    try {
      setSelectedColor(nextColor);
      setSchemeState((prev) => ({
        ...prev,
        selectedColor: nextColor,
      }));

      const data = await setMachineColor(nextColor);
      const updatedColor = data?.target_color ?? nextColor;
      const selectedOption = COLORS.find((item) => item.value === updatedColor);

      setSelectedColor(updatedColor);
      setSchemeState((prev) => ({
        ...prev,
        selectedColor: updatedColor,
      }));

      addNotification(
        `Выбран целевой цвет: ${selectedOption?.label ?? updatedColor}`,
        "info",
      );
    } catch (error) {
      console.error(error);

      addNotification(error.message || "Ошибка выбора цвета", "error");
      syncSettings();
    }
  };

  const selectedColorLabel = useMemo(() => {
    return COLORS.find((item) => item.value === selectedColor)?.label || selectedColor;
  }, [selectedColor]);

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
              <MachineScheme
                schemeState={schemeState}
                onInfoChange={setSchemeInfo}
              />
            </section>

            <section className="machine-control-page__content">
              <MachineBlocks blocks={MACHINE_BLOCKS} />

              <SystemInfo
                machineStatus={machineStatus}
                selectedColor={selectedColorLabel}
                schemeState={schemeState}
                schemeInfo={schemeInfo}
              />
            </section>

            <Notifications
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