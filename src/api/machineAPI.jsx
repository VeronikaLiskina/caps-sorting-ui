const BASE_URL = "http://localhost:8000";

async function request(url, options = {}) {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMessage = data?.detail || "Ошибка запроса к серверу";
    throw new Error(errorMessage);
  }

  return data;
}

export async function startMachine() {
  return request("/start", {
    method: "POST",
  });
}

export async function stopMachine() {
  return request("/stop", {
    method: "POST",
  });
}

export async function getMachineStatus() {
  return request("/settings", {
    method: "GET",
  });
}

export async function setMachineColor(color) {
  return request("/settings", {
    method: "PUT",
    body: JSON.stringify({
      target_color: color,
    }),
  });
}
