// Types
interface TimerData {
  timeRemaining: number;
  isActive: boolean;
}

interface Settings {
  regularSubTime: number;
  tier2SubTime: number;
  tier3SubTime: number;
  primeSubTime: number;
  giftSubTime: number;
}

interface TimerStyle {
  color: string;
  fontFamily: string;
  shadowColor: string;
  shadowBlur: number;
  shadowOpacity: number;
  shadowX: number;
  shadowY: number;
}

interface TimerStyling {
  timerColor: string;
  timerFont: string;
  timerShadowColor: string;
  timerShadowBlur: number;
  timerShadowOpacity: number;
  timerShadowX: number;
  timerShadowY: number;
}

interface Subscription {
  username: string;
  msgId: string;
  subPlan?: string;
  tierName?: string;
  timeAdded: number;
  timestamp: string;
}

interface SubscriptionEvent {
  username: string;
  msgId: string;
  subPlan?: string;
  tierName?: string;
  timeAdded: number;
  subCount?: number;
  subType?: string;
  months?: number;
  timestamp: number;
}

interface Event {
  source: string;
  message: string;
  time: string;
}

// Local Storage Keys
const LocalStorageKeys = {
  TIMER_DATA: "penta_timer_data",
  SETTINGS: "penta_settings",
  TIMER_STYLE: "penta_timer_style",
};

export const useTimer = () => {
  // Reactive state
  const timerData = ref<TimerData>({ timeRemaining: 3600, isActive: false });
  const events = ref<Event[]>([]);
  const subscriptions = ref<Subscription[]>([]);
  const latestSubscription = ref<SubscriptionEvent | null>(null);
  const settings = ref<Settings>({
    regularSubTime: 60,
    tier2SubTime: 120,
    tier3SubTime: 180,
    primeSubTime: 60,
    giftSubTime: 60,
  });
  const currentTimerStyle = ref<TimerStyle>({
    color: "#60e9b9",
    fontFamily: "'Nunito', sans-serif",
    shadowColor: "#000000",
    shadowBlur: 4,
    shadowOpacity: 0.3,
    shadowX: 2,
    shadowY: 2,
  });

  let ws: WebSocket | null = null;

  // Helper functions
  function saveToLocalStorage(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  }

  function loadFromLocalStorage(key: string, defaultValue: any = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.warn("Failed to load from localStorage:", error);
      return defaultValue;
    }
  }

  function saveTimerData() {
    saveToLocalStorage(LocalStorageKeys.TIMER_DATA, timerData.value);
  }

  function loadTimerData() {
    const saved = loadFromLocalStorage(LocalStorageKeys.TIMER_DATA);
    if (saved) {
      timerData.value = { ...timerData.value, ...saved };
    }
  }

  function saveSettingsToStorage() {
    saveToLocalStorage(LocalStorageKeys.SETTINGS, settings.value);
    return settings.value;
  }

  async function loadSettings() {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/settings`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      // Update settings with server response
      if (result.regularSubTime !== undefined) {
        settings.value.regularSubTime = result.regularSubTime;
      }
      if (result.tier2SubTime !== undefined) {
        settings.value.tier2SubTime = result.tier2SubTime;
      }
      if (result.tier3SubTime !== undefined) {
        settings.value.tier3SubTime = result.tier3SubTime;
      }
      if (result.primeSubTime !== undefined) {
        settings.value.primeSubTime = result.primeSubTime;
      }
      if (result.giftSubTime !== undefined) {
        settings.value.giftSubTime = result.giftSubTime;
      }

      // Save the loaded settings to localStorage
      saveSettingsToStorage();

      return settings.value;
    } catch (error) {
      console.warn("Failed to load settings from server:", error);
      // Return current settings as fallback
      return settings.value;
    }
  }

  function saveTimerStyleToStorage() {
    saveToLocalStorage(LocalStorageKeys.TIMER_STYLE, currentTimerStyle.value);
  }

  function loadTimerStyleFromStorage() {
    const saved = loadFromLocalStorage(LocalStorageKeys.TIMER_STYLE);
    if (saved) {
      currentTimerStyle.value = { ...currentTimerStyle.value, ...saved };
    }
  }

  // Add event function
  function addEvent(source: string, message: string) {
    const event = {
      source,
      message,
      time: new Date().toLocaleTimeString(),
    };

    events.value.unshift(event);
    if (events.value.length > 20) events.value.pop();
  }

  // Add subscription function
  function addSubscription(data: any) {
    const subscription: Subscription = {
      username: data.username,
      msgId: data.msgId,
      subPlan: data.subPlan,
      tierName: data.tierName,
      timeAdded: data.timeAdded,
      timestamp: new Date().toLocaleTimeString(),
    };

    subscriptions.value.unshift(subscription);
    if (subscriptions.value.length > 20) subscriptions.value.pop();
  }

  // WebSocket functions
  function initWebSocket() {
    const config = useRuntimeConfig();
    let wsUrl = config.public.wsUrl as string;
    if (!wsUrl || wsUrl.trim() === "") {
      // Derive WS URL from API URL if not explicitly provided
      const apiUrl = (config.public.apiUrl as string) || "";
      try {
        if (apiUrl) {
          const u = new URL(apiUrl);
          u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
          // Assume WS is served on same host/port as API when not set
          wsUrl = `${u.protocol}//${u.host}`;
        } else if (process.client && location.origin) {
          // Fallback to browser origin
          const isSecure = location.protocol === "https:";
          wsUrl = `${isSecure ? "wss:" : "ws:"}//${location.host}`;
        }
      } catch (e) {
        // Last resort: try browser origin
        if (process.client && location.origin) {
          const isSecure = location.protocol === "https:";
          wsUrl = `${isSecure ? "wss:" : "ws:"}//${location.host}`;
        }
      }
    }

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      addEvent("System", "Connected to server");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      addEvent("System", "Disconnected from server");
      setTimeout(initWebSocket, 3000); // Reconnect after 3 seconds
    };
  }

  function handleWebSocketMessage(data: any) {
    switch (data.type) {
      case "timer_update":
      case "timer_started":
      case "timer_stopped":
      case "timer_reset":
      case "time_added":
        timerData.value = { timeRemaining: data.timeRemaining, isActive: data.isActive };
        saveTimerData();

        if (data.type === "time_added") {
          if (data.subscriber) {
            const countInfo =
              data.subscriber.subCount && data.subscriber.subCount > 1
                ? ` x${data.subscriber.subCount}`
                : "";
            addEvent(
              "Timer",
              `Added ${data.addedTime}s via ${data.subscriber.username}${countInfo} (${data.subscriber.tierName})`
            );
          } else {
            addEvent("Timer", `Added ${data.addedTime} seconds`);
          }
        } else if (data.type === "timer_started") {
          addEvent("Timer", "Timer started");
        } else if (data.type === "timer_stopped") {
          addEvent("Timer", "Timer stopped");
        } else if (data.type === "timer_reset") {
          addEvent("Timer", "Timer reset");
        }
        break;

      case "timer_style_update":
        if (data.style) {
          currentTimerStyle.value = {
            color: data.style.timerColor || currentTimerStyle.value.color,
            fontFamily: data.style.timerFont || currentTimerStyle.value.fontFamily,
            shadowColor: data.style.timerShadowColor || currentTimerStyle.value.shadowColor,
            shadowBlur: data.style.timerShadowBlur ?? currentTimerStyle.value.shadowBlur,
            shadowOpacity: data.style.timerShadowOpacity ?? currentTimerStyle.value.shadowOpacity,
            shadowX: data.style.timerShadowX ?? currentTimerStyle.value.shadowX,
            shadowY: data.style.timerShadowY ?? currentTimerStyle.value.shadowY,
          };
          saveTimerStyleToStorage();
          addEvent("Timer", "Timer style updated");
        }
        break;

      case "subscription":
        const subType = data.tierName || "Unknown";
        const countInfo = data.subCount && data.subCount > 1 ? ` x${data.subCount}` : "";
        const monthsInfo = data.months ? ` (${data.months} months)` : "";
        addEvent(
          "Subscription",
          `${data.username} ${data.msgId}${countInfo} (${subType})${monthsInfo} - +${data.timeAdded}s`
        );
        addSubscription(data);
        latestSubscription.value = {
          username: data.username,
          msgId: data.msgId,
          subPlan: data.subPlan,
          tierName: data.tierName,
          timeAdded: data.timeAdded,
          subCount: data.subCount,
          subType: data.subType,
          months: data.months,
          timestamp: Date.now(),
        };
        break;

      case "timer_ended":
        timerData.value = { timeRemaining: 0, isActive: false };
        saveTimerData();
        addEvent("Timer", "🚨 TIMER ENDED! 🚨");
        break;

      case "settings_updated":
        // Handle settings updates from server, but don't override if we're actively editing
        if (data.settings) {
          console.log("Received settings_updated from server:", data.settings);
          // Only update if the settings are different from what we have locally
          // This prevents circular updates when we save settings
          const currentSettingsStr = JSON.stringify(settings.value);
          const newSettingsStr = JSON.stringify(data.settings);

          if (currentSettingsStr !== newSettingsStr) {
            Object.assign(settings.value, data.settings);
            saveSettingsToStorage();
            addEvent("System", "Settings updated from server");
          }
        }
        break;
    }
  }

  // Helper function to get API base URL
  function getApiBaseUrl(): string {
    const config = useRuntimeConfig();
    const configured = (config.public.apiUrl as string) || "";
    if (configured && configured.trim() !== "") {
      return configured;
    }

    if (process.client) {
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;

      // Local development: default to backend on port 3000
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
        return `${protocol}//localhost:3000`;
      }

      // Production heuristic: try api.<host>
      if (!hostname.startsWith("api.")) {
        return `${protocol}//api.${hostname}`;
      }

      // Fallback to current origin
      return window.location.origin;
    }

    // Non-browser fallback
    return "http://localhost:3000";
  }

  // API functions
  async function startTimer(): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/timer/start`, { method: "POST" });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, message: "Failed to start timer" };
    }
  }

  async function stopTimer(): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/timer/stop`, { method: "POST" });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, message: "Failed to stop timer" };
    }
  }

  async function resetTimer(time: number): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/timer/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time }),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, message: "Failed to reset timer" };
    }
  }

  async function addTime(seconds: number): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/timer/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds }),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, message: "Failed to add time" };
    }
  }
  async function updateSettings(
    settings: Settings
  ): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, message: "Failed to update settings" };
    }
  }

  async function saveSettings(): Promise<{ success: boolean; message: string }> {
    console.log("saveSettings called with:", settings.value);

    // Save to localStorage immediately
    saveSettingsToStorage();

    try {
      const baseUrl = getApiBaseUrl();
      console.log("Sending settings to server:", settings.value);

      const response = await fetch(`${baseUrl}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings.value),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Server response:", result);

      // Don't immediately reload settings after save to avoid overwriting
      return result;
    } catch (error) {
      console.error("Failed to save settings to server:", error);
      return { success: false, message: "Failed to sync settings to server" };
    }
  }

  async function saveTimerStyle(
    stylingData: TimerStyling
  ): Promise<{ success: boolean; message: string }> {
    // Update current timer style and save to localStorage immediately
    currentTimerStyle.value = {
      color: stylingData.timerColor,
      fontFamily: stylingData.timerFont,
      shadowColor: stylingData.timerShadowColor,
      shadowBlur: stylingData.timerShadowBlur,
      shadowOpacity: stylingData.timerShadowOpacity,
      shadowX: stylingData.timerShadowX,
      shadowY: stylingData.timerShadowY,
    };
    saveTimerStyleToStorage();

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stylingData),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, message: "Failed to sync timer style to server" };
    }
  }

  // Development/Testing API functions
  async function simulateSubscription(
    tier: string,
    username: string = "TestUser",
    type: string = "sub"
  ): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/dev/simulate-sub`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, tier, type }),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, message: "Failed to simulate subscription" };
    }
  }

  async function simulateGiftSubscription(
    tier: string,
    count: number,
    username: string = "GiftBomber"
  ): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/dev/simulate-sub`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, tier, type: "gift", count }),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, message: "Failed to simulate gift subscription" };
    }
  }

  async function simulateResubscription(
    tier: string,
    months: number,
    username: string = "LoyalViewer"
  ): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/dev/simulate-sub`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, tier, type: "resub", months }),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, message: "Failed to simulate resubscription" };
    }
  }

  async function simulateRandomSubscription(): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/dev/simulate-random-sub`, {
        method: "POST",
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, message: "Failed to simulate random subscription" };
    }
  }

  async function simulateGiftBomb(
    tier: string = "1",
    count: number = 10,
    username: string = "GiftBomber"
  ): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/dev/simulate-gift-bomb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, tier, count }),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: false, message: "Failed to simulate gift bomb" };
    }
  }

  // Load initial data
  async function loadInitialData() {
    // First, load from localStorage (immediate)
    loadTimerData();
    loadTimerStyleFromStorage();

    // Then sync with server (may update localStorage if server has newer data)
    try {
      const baseUrl = getApiBaseUrl();

      // Load timer state from server
      const timerResponse = await fetch(`${baseUrl}/api/timer`);
      if (timerResponse.ok) {
        const serverTimerData = await timerResponse.json();

        // Only update if server data seems more recent or localStorage is empty
        if (
          !loadFromLocalStorage(LocalStorageKeys.TIMER_DATA) ||
          serverTimerData.timeRemaining !== timerData.value.timeRemaining
        ) {
          timerData.value = {
            timeRemaining: serverTimerData.timeRemaining,
            isActive: serverTimerData.isActive,
          };
          saveTimerData();
        }
      }

      // Load settings from server using the dedicated function
      await loadSettings();

      // Load timer styling from server settings
      const settingsResponse = await fetch(`${baseUrl}/api/settings`);
      if (settingsResponse.ok) {
        const serverSettings = await settingsResponse.json();

        let stylingUpdated = false;
        if (serverSettings.timerColor) {
          currentTimerStyle.value.color = serverSettings.timerColor;
          stylingUpdated = true;
        }
        if (serverSettings.timerFont) {
          currentTimerStyle.value.fontFamily = serverSettings.timerFont;
          stylingUpdated = true;
        }
        if (serverSettings.timerShadowColor) {
          currentTimerStyle.value.shadowColor = serverSettings.timerShadowColor;
          stylingUpdated = true;
        }
        if (serverSettings.timerShadowBlur !== undefined) {
          currentTimerStyle.value.shadowBlur = serverSettings.timerShadowBlur;
          stylingUpdated = true;
        }
        if (serverSettings.timerShadowOpacity !== undefined) {
          currentTimerStyle.value.shadowOpacity = serverSettings.timerShadowOpacity;
          stylingUpdated = true;
        }
        if (serverSettings.timerShadowX !== undefined) {
          currentTimerStyle.value.shadowX = serverSettings.timerShadowX;
          stylingUpdated = true;
        }
        if (serverSettings.timerShadowY !== undefined) {
          currentTimerStyle.value.shadowY = serverSettings.timerShadowY;
          stylingUpdated = true;
        }

        if (stylingUpdated) {
          saveTimerStyleToStorage();
        }
      }

      addEvent("System", "Data synced with server");
    } catch (error) {
      console.error("Failed to load server data:", error);
      addEvent("System", "Using offline data (server unavailable)");
    }
  }

  // Initialize function
  function initialize() {
    if (process.client) {
      initWebSocket();
      loadInitialData();

      // Periodically save timer data (every 10 seconds)
      setInterval(() => {
        if (timerData.value.isActive) {
          saveTimerData();
        }
      }, 10000);

      // Save data when page is about to unload
      window.addEventListener("beforeunload", () => {
        saveTimerData();
        saveSettingsToStorage();
        saveTimerStyleToStorage();
      });
    }
  }

  return {
    // State
    timerData: readonly(timerData),
    events: readonly(events),
    subscriptions: readonly(subscriptions),
    // Expose settings as mutable so the admin UI can update values before saving
    settings,
    currentTimerStyle: readonly(currentTimerStyle),
    latestSubscription: readonly(latestSubscription),

    // Actions
    startTimer,
    stopTimer,
    resetTimer,
    addTime,
    saveSettings,
    saveTimerStyle,
    initialize,
    loadSettings,

    // Development/Testing
    simulateSubscription,
    simulateGiftSubscription,
    simulateResubscription,
    simulateRandomSubscription,
    simulateGiftBomb,

    // Utility
    addEvent,
  };
};
