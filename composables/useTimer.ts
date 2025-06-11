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

  function loadSettings() {
    const saved = loadFromLocalStorage(LocalStorageKeys.SETTINGS);
    if (saved) {
      settings.value = { ...settings.value, ...saved };
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
    const wsUrl = config.public.wsUrl;

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
          addEvent("Timer", `Added ${data.addedTime} seconds`);
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
        addEvent(
          "Subscription",
          `${data.username} ${data.msgId} (${subType}) - +${data.timeAdded}s`
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
    }
  }

  // Helper function to get API base URL
  function getApiBaseUrl(): string {
    const config = useRuntimeConfig();
    return config.public.apiUrl as string;
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
    // Save to localStorage immediately
    saveSettingsToStorage();

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings.value),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      return { success: true, message: "Settings saved locally (server sync failed)" };
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
      return { success: true, message: "Timer style saved locally (server sync failed)" };
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
    loadSettings();
    loadTimerStyleFromStorage();

    // Then sync with server (may update localStorage if server has newer data)
    try {
      const baseUrl = getApiBaseUrl();

      // Load timer state from server
      const timerResponse = await fetch(`${baseUrl}/api/timer`);
      const serverTimerData = await timerResponse.json();

      // Only update if server data seems more recent or localStorage is empty
      if (
        !loadFromLocalStorage(LocalStorageKeys.TIMER_DATA) ||
        serverTimerData.timeRemaining !== timerData.value.timeRemaining
      ) {
        timerData.value = serverTimerData;
        saveTimerData();
      }

      // Load settings from server
      const settingsResponse = await fetch(`${baseUrl}/api/settings`);
      const serverSettings = await settingsResponse.json();

      // Update settings with server settings if available
      if (serverSettings.regularSubTime !== undefined) {
        settings.value.regularSubTime = serverSettings.regularSubTime;
      }
      if (serverSettings.tier2SubTime !== undefined) {
        settings.value.tier2SubTime = serverSettings.tier2SubTime;
      }
      if (serverSettings.tier3SubTime !== undefined) {
        settings.value.tier3SubTime = serverSettings.tier3SubTime;
      }
      if (serverSettings.primeSubTime !== undefined) {
        settings.value.primeSubTime = serverSettings.primeSubTime;
      }

      // Load timer styling from server
      if (serverSettings.timerColor) {
        currentTimerStyle.value.color = serverSettings.timerColor;
      }
      if (serverSettings.timerFont) {
        currentTimerStyle.value.fontFamily = serverSettings.timerFont;
      }
      if (serverSettings.timerShadowColor) {
        currentTimerStyle.value.shadowColor = serverSettings.timerShadowColor;
      }
      if (serverSettings.timerShadowBlur !== undefined) {
        currentTimerStyle.value.shadowBlur = serverSettings.timerShadowBlur;
      }
      if (serverSettings.timerShadowOpacity !== undefined) {
        currentTimerStyle.value.shadowOpacity = serverSettings.timerShadowOpacity;
      }
      if (serverSettings.timerShadowX !== undefined) {
        currentTimerStyle.value.shadowX = serverSettings.timerShadowX;
      }
      if (serverSettings.timerShadowY !== undefined) {
        currentTimerStyle.value.shadowY = serverSettings.timerShadowY;
      }

      // Save any server settings to localStorage
      saveSettingsToStorage();
      saveTimerStyleToStorage();

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
    settings: readonly(settings),
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
