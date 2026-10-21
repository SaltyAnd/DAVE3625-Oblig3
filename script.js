(() => {
  // Storage keys and limits used throughout the app.
  const ENTRIES_KEY = "blueflow.entries";
  const GOAL_KEY = "blueflow.goal";
  const UNIT_KEY = "blueflow.unit";
  const CONTAINERS_KEY = "blueflow.containers";
  const LEGACY_SOURCES_KEY = "blueflow.sources";
  const DEFAULT_GOAL_ML = 2000;
  const MAX_INTAKE_ML = 5000;
  const dateElement = document.querySelector("#today-date");
  const waterElement = document.querySelector("#water-amount");
  const alternativeElement = document.querySelector("#alternative-amount");
  const totalElement = document.querySelector("#total-amount");
  const goalInput = document.querySelector("#goal-input");
  const goalUnit = document.querySelector("#goal-unit");
  const mlButton = document.querySelector("#ml-button");
  const lButton = document.querySelector("#l-button");
  const progressTrack = document.querySelector("#progress-track");
  const progressFill = document.querySelector("#progress-fill");
  const alternativeFill = document.querySelector("#alternative-fill");
  const progressMessage = document.querySelector("#progress-message");
  const remainingElement = document.querySelector("#remaining-amount");
  const calendarGrid = document.querySelector("#calendar-grid");
  const calendarMonth = document.querySelector("#calendar-month");
  const previousMonthButton = document.querySelector("#previous-month");
  const nextMonthButton = document.querySelector("#next-month");
  const selectedDateLabel = document.querySelector("#selected-date-label");
  const selectedWater = document.querySelector("#selected-water");
  const selectedAlternative = document.querySelector("#selected-alternative");
  const selectedTotal = document.querySelector("#selected-total");
  const historyHeading = document.querySelector("#history-heading");
  const historyList = document.querySelector("#history-list");
  const emptyState = document.querySelector("#empty-state");
  const entryCount = document.querySelector("#entry-count");
  const notice = document.querySelector("#notice");
  const customForm = document.querySelector("#custom-form");
  const customAmount = document.querySelector("#custom-amount");
  const customAmountLabel = document.querySelector('label[for="custom-amount"]');
  const containerForms = document.querySelectorAll(".container-form");
  const containerAmounts = document.querySelectorAll(".container-amount");
  const alternativeForm = document.querySelector("#alternative-form");
  const alternativeName = document.querySelector("#alternative-name");
  const alternativeVolume = document.querySelector("#alternative-volume");
  const quickAdds = document.querySelector(".quick-adds");
  const alternativeContainers = document.querySelector(".alternative-containers");
  const quickAddAmounts = document.querySelectorAll(".drink-amount");

  // Today's date controls logging and the drink list; calendar selection is for summaries.
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const dateFormatter = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" });
  let entries = readEntries();
  let containers = readContainers();
  let dailyGoal = readGoal();
  let unit = readUnit();
  let selectedDate = todayKey;
  let displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  dateElement.dateTime = todayKey;
  dateElement.textContent = dateFormatter.format(today);
  previousMonthButton.addEventListener("click", () => changeMonth(-1));
  nextMonthButton.addEventListener("click", () => changeMonth(1));

  // Read and validate persisted data before using it in the interface.
  function readEntries() {
    try {
      const saved = JSON.parse(localStorage.getItem(ENTRIES_KEY) || "[]");
      if (!Array.isArray(saved)) throw new Error("Saved water entries are not a list.");
      return saved.filter((entry) =>
        entry && typeof entry.id === "string" && typeof entry.date === "string" &&
        typeof entry.label === "string" && Number.isFinite(entry.amount) &&
        Number.isFinite(entry.time) && entry.amount > 0
      ).map((entry) => ({
        ...entry,
        type: entry.type === "alternative" ? "alternative" : "water"
      }));
    } catch (error) {
      console.error("Could not load saved water entries.", error);
      notice.textContent = "Saved entries could not be loaded. You can still add water.";
      return [];
    }
  }

  function readGoal() {
    try {
      const saved = Number(localStorage.getItem(GOAL_KEY));
      return Number.isInteger(saved) && saved > 0 && saved <= 20000 ? saved : DEFAULT_GOAL_ML;
    } catch (error) {
      console.error("Could not load the saved daily goal.", error);
      return DEFAULT_GOAL_ML;
    }
  }

  function readContainers() {
    try {
      const savedValue = localStorage.getItem(CONTAINERS_KEY) ?? localStorage.getItem(LEGACY_SOURCES_KEY) ?? "[]";
      const saved = JSON.parse(savedValue);
      if (!Array.isArray(saved)) throw new Error("Saved containers are not a list.");
      return saved.filter((container) =>
        container && typeof container.id === "string" && typeof container.name === "string" &&
        Number.isInteger(container.amount) && container.amount > 0 && container.amount <= MAX_INTAKE_ML
      );
    } catch (error) {
      console.error("Could not load saved containers.", error);
      notice.textContent = "Custom containers could not be loaded.";
      return [];
    }
  }

  function readUnit() {
    try {
      const saved = localStorage.getItem(UNIT_KEY);
      return saved === "L" ? "L" : "mL";
    } catch (error) {
      console.error("Could not load the selected volume unit.", error);
      return "mL";
    }
  }

  // Convert stored millilitres into the unit currently selected by the user.
  function formatAmount(amountMl) {
    const value = unit === "L" ? amountMl / 1000 : amountMl;
    const formatted = value.toLocaleString(undefined, {
      maximumFractionDigits: unit === "L" ? 3 : 0
    });
    return `${formatted} ${unit}`;
  }

  function formatGoalInput() {
    return unit === "L" ? String(dailyGoal / 1000) : String(dailyGoal);
  }

  function updateUnitControls() {
    const isLitres = unit === "L";
    mlButton.setAttribute("aria-pressed", String(!isLitres));
    lButton.setAttribute("aria-pressed", String(isLitres));
    document.querySelectorAll(".volume-unit").forEach((element) => { element.textContent = unit; });
    goalUnit.textContent = unit;
    goalInput.setAttribute("aria-label", `Daily goal in ${unit}`);
    goalInput.min = isLitres ? "0.001" : "1";
    goalInput.max = isLitres ? "20" : "20000";
    goalInput.step = isLitres ? "0.001" : "1";
    goalInput.inputMode = isLitres ? "decimal" : "numeric";
    customAmount.min = isLitres ? "0.001" : "1";
    customAmount.max = isLitres ? "5" : String(MAX_INTAKE_ML);
    customAmount.step = isLitres ? "0.001" : "1";
    customAmount.inputMode = isLitres ? "decimal" : "numeric";
    customAmount.placeholder = `Amount (${unit})`;
    customAmountLabel.textContent = `Custom water amount in ${unit}`;
    for (const amount of containerAmounts) {
      amount.min = isLitres ? "0.001" : "1";
      amount.max = isLitres ? "5" : String(MAX_INTAKE_ML);
      amount.step = isLitres ? "0.001" : "1";
      amount.inputMode = isLitres ? "decimal" : "numeric";
      amount.placeholder = `Amount (${unit})`;
    }
    alternativeVolume.min = isLitres ? "0.001" : "1";
    alternativeVolume.max = isLitres ? "5" : String(MAX_INTAKE_ML);
    alternativeVolume.step = isLitres ? "0.001" : "1";
    alternativeVolume.inputMode = isLitres ? "decimal" : "numeric";
    alternativeVolume.placeholder = `Amount (${unit})`;
    for (const amount of document.querySelectorAll(".alternative-quick-adds .drink-amount")) {
      amount.textContent = formatAmount(Number(amount.dataset.ml));
    }
    for (const amount of quickAddAmounts) {
      amount.textContent = formatAmount(Number(amount.dataset.ml));
    }
  }

  // Keep browser storage writes in one place so failures can be reported.
  function saveEntries() {
    try {
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
      return true;
    } catch (error) {
      console.error("Could not save water entries.", error);
      notice.textContent = "Could not save your change. Check your browser storage settings.";
      return false;
    }
  }

  function saveGoal() {
    try {
      localStorage.setItem(GOAL_KEY, String(dailyGoal));
      return true;
    } catch (error) {
      console.error("Could not save the daily goal.", error);
      notice.textContent = "Could not save your goal. Check your browser storage settings.";
      return false;
    }
  }

  function saveContainers() {
    try {
      localStorage.setItem(CONTAINERS_KEY, JSON.stringify(containers));
      return true;
    } catch (error) {
      console.error("Could not save custom containers.", error);
      notice.textContent = "Could not save your container. Check your browser storage settings.";
      return false;
    }
  }

  // Build water and alternative-fluid shortcuts from the saved containers.
  function renderContainers() {
    for (const [containerList, type] of [[quickAdds, "water"], [alternativeContainers, "alternative"]]) {
      containerList.querySelectorAll(".custom-container").forEach((container) => container.remove());
      for (const container of containers) {
        const wrapper = document.createElement("div");
        wrapper.className = "custom-container";
        const addButton = document.createElement("button");
        addButton.className = "quick-add";
        addButton.type = "button";
        addButton.setAttribute("aria-label", `Add ${container.name}, ${formatAmount(container.amount)}`);
        const icon = document.createElement("span");
        icon.className = "drink-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = type === "alternative" ? "🍹" : "💧";
        const label = document.createElement("span");
        const name = document.createElement("span");
        name.className = "drink-name";
        name.textContent = container.name;
        const amount = document.createElement("span");
        amount.className = "drink-amount";
        amount.textContent = formatAmount(container.amount);
        label.append(name, amount);
        addButton.append(icon, label);
        addButton.addEventListener("click", () => addEntry(container.amount, container.name, type));
        const removeButton = document.createElement("button");
        removeButton.className = "container-remove";
        removeButton.type = "button";
        removeButton.textContent = "×";
        removeButton.setAttribute("aria-label", `Remove ${container.name} container`);
        removeButton.addEventListener("click", () => removeContainer(container.id));
        wrapper.append(addButton, removeButton);
        containerList.append(wrapper);
      }
    }
  }

  // Calendar and history helpers use local dates to avoid UTC day shifts.
  function dateKeyFor(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function entriesForDate(dateKey) {
    return entries
      .filter((entry) => entry.date === dateKey)
      .sort((a, b) => b.time - a.time);
  }

  function changeMonth(offset) {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + offset, 1);
    const selectedDay = Number(selectedDate.slice(-2));
    const day = Math.min(selectedDay, new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() + 1,
      0
    ).getDate());
    selectedDate = dateKeyFor(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), day));
    renderCalendar();
    renderHistory();
  }

  function selectDate(dateKey) {
    selectedDate = dateKey;
    renderCalendar();
    renderHistory();
  }

  // Rebuild the month grid and mark dates that contain logged drinks.
  function renderCalendar() {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);
    const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
    const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    calendarMonth.textContent = monthFormatter.format(displayedMonth);
    previousMonthButton.disabled = monthStart <= new Date(2000, 0, 1);
    nextMonthButton.disabled = monthEnd > currentMonthStart;
    calendarGrid.replaceChildren();

    for (const weekday of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      const heading = document.createElement("span");
      heading.className = "weekday";
      heading.textContent = weekday;
      calendarGrid.append(heading);
    }

    for (let blank = 0; blank < firstWeekday; blank += 1) {
      const spacer = document.createElement("span");
      spacer.setAttribute("aria-hidden", "true");
      calendarGrid.append(spacer);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = dateKeyFor(date);
      const dayEntries = entriesForDate(key);
      const hasEntries = dayEntries.length > 0;
      const button = document.createElement("button");
      button.className = `calendar-day${hasEntries ? " has-entries" : ""}`;
      button.type = "button";
      button.textContent = String(day);
      button.setAttribute("aria-pressed", String(key === selectedDate));
      button.setAttribute("aria-label", `${dayFormatter.format(date)}${hasEntries ? `, ${dayEntries.length} drink entries` : ""}`);
      button.disabled = key > todayKey;
      button.addEventListener("click", () => selectDate(key));
      calendarGrid.append(button);
    }
  }

  // Keep the calendar summary date-selectable while always listing today's drinks.
  function renderHistory() {
    const selectedEntries = entriesForDate(selectedDate);
    const todaysEntries = entriesForDate(todayKey);
    const waterTotal = selectedEntries
      .filter((entry) => entry.type === "water")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const alternativeTotal = selectedEntries
      .filter((entry) => entry.type === "alternative")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const selectedDateValue = new Date(`${selectedDate}T00:00:00`);
    const selectedFormatter = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    selectedDateLabel.textContent = selectedFormatter.format(selectedDateValue);
    selectedWater.textContent = formatAmount(waterTotal);
    selectedAlternative.textContent = formatAmount(alternativeTotal);
    selectedTotal.textContent = formatAmount(waterTotal + alternativeTotal);
    historyHeading.textContent = "Today's drinks";
    entryCount.textContent = `${todaysEntries.length} ${todaysEntries.length === 1 ? "entry" : "entries"}`;
    emptyState.hidden = todaysEntries.length > 0;
    historyList.replaceChildren();

    for (const entry of todaysEntries) {
      const item = document.createElement("li");
      item.className = "history-item";
      const info = document.createElement("div");
      info.className = "entry-info";
      const icon = document.createElement("span");
      icon.className = "entry-symbol";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = getEntryIcon(entry);
      const text = document.createElement("div");
      const title = document.createElement("div");
      title.className = "entry-title";
      title.textContent = entry.label;
      const time = document.createElement("div");
      time.className = "entry-time";
      time.textContent = new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).format(entry.time);
      text.append(title, time);
      info.append(icon, text);

      const right = document.createElement("div");
      right.className = "entry-right";
      const volume = document.createElement("span");
      volume.className = "entry-volume";
      volume.textContent = formatAmount(entry.amount);
      const remove = document.createElement("button");
      remove.className = "remove-button";
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove ${entry.label}, ${formatAmount(entry.amount)}`);
      remove.addEventListener("click", () => removeEntry(entry.id));
      right.append(volume, remove);
      item.append(info, right);
      historyList.append(item);
    }
  }

  // Refresh all visible values after a saved setting or entry changes.
  function render() {
    const todaysEntries = entries
      .filter((entry) => entry.date === todayKey)
      .sort((a, b) => b.time - a.time);
    const waterTotal = todaysEntries
      .filter((entry) => entry.type === "water")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const alternativeTotal = todaysEntries
      .filter((entry) => entry.type === "alternative")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const total = waterTotal + alternativeTotal;
    const percentage = Math.min(100, Math.round((waterTotal / dailyGoal) * 100));
    const totalPercentage = Math.min(100, (total / dailyGoal) * 100);
    const remaining = Math.max(0, dailyGoal - waterTotal);

    updateUnitControls();
    renderContainers();
    waterElement.textContent = formatValue(waterTotal);
    alternativeElement.textContent = formatValue(alternativeTotal);
    totalElement.textContent = formatValue(total);
    goalInput.value = formatGoalInput();
    progressFill.style.width = `${percentage}%`;
    alternativeFill.style.width = `${totalPercentage}%`;
    progressTrack.setAttribute("aria-valuenow", String(percentage));
    progressTrack.setAttribute("aria-valuetext", `${formatAmount(waterTotal)} water, ${formatAmount(alternativeTotal)} alternative fluid, ${formatAmount(total)} total`);
    progressMessage.textContent = `${percentage}% of daily goal`;
    remainingElement.textContent = remaining > 0 ? `${formatAmount(remaining)} to go` : "Goal complete";
    renderCalendar();
    renderHistory();
  }

  // Keep the progress bar's accessible percentage in sync with the totals.
  function formatValue(amountMl) {
    return (unit === "L" ? amountMl / 1000 : amountMl).toLocaleString(undefined, {
      maximumFractionDigits: unit === "L" ? 3 : 0
    });
  }

  // Use matching symbols in the drink history and quick-add controls.
  function getEntryIcon(entry) {
    if (entry.type === "alternative") {
      if (entry.label === "Glass") return "☕";
      if (entry.label === "Medium bottle") return "🥤";
      return entry.label === "Large bottle" ? "🧃" : "🍹";
    }
    if (entry.label === "Glass of water") return "🥛";
    if (entry.label === "Medium bottle") return "🧴";
    return entry.label === "Large bottle" ? "🫙" : "💧";
  }

  // Entry and container changes are rolled back if browser storage fails.
  function addEntry(amount, label, type = "water") {
    const normalizedLabel = label.trim();
    if (!normalizedLabel || !Number.isInteger(amount) || amount < 1 || amount > MAX_INTAKE_ML) {
      notice.textContent = `Enter an amount from ${unit === "L" ? "0.001 to 5 L" : `1 to ${MAX_INTAKE_ML.toLocaleString()} mL`}.`;
      return;
    }
    const entry = { id: crypto.randomUUID(), date: todayKey, label: normalizedLabel, amount, time: Date.now(), type };
    entries.push(entry);
    if (saveEntries()) {
      notice.textContent = "";
      render();
    } else {
      entries = entries.filter((saved) => saved.id !== entry.id);
    }
  }

  function removeEntry(id) {
    const removed = entries.find((entry) => entry.id === id);
    if (removed && removed.date !== todayKey) {
      notice.textContent = "Only today's drinks can be removed.";
      return;
    }
    entries = entries.filter((entry) => entry.id !== id);
    if (saveEntries()) render();
    else if (removed) entries.push(removed);
  }

  function addContainer(name, amount, nameInput) {
    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.length > 30 ||
        !Number.isInteger(amount) || amount < 1 || amount > MAX_INTAKE_ML) {
      notice.textContent = `Enter a container name and an amount from ${unit === "L" ? "0.001 to 5 L" : `1 to ${MAX_INTAKE_ML.toLocaleString()} mL`}.`;
      return false;
    }
    if (containers.some((container) => container.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
      notice.textContent = "A container with that name already exists.";
      nameInput.focus();
      return false;
    }
    const container = { id: crypto.randomUUID(), name: normalizedName, amount };
    containers.push(container);
    if (!saveContainers()) {
      containers = containers.filter((saved) => saved.id !== container.id);
      return false;
    }
    notice.textContent = "";
    render();
    return true;
  }

  function removeContainer(id) {
    const removed = containers.find((container) => container.id === id);
    containers = containers.filter((container) => container.id !== id);
    if (saveContainers()) {
      notice.textContent = "";
      render();
    } else if (removed) {
      containers.push(removed);
      render();
    }
  }

  // Connect fixed quick-add buttons and editable forms to the app actions.
  document.querySelectorAll(".quick-add[data-amount]").forEach((button) => {
    button.addEventListener("click", () => addEntry(
      Number(button.dataset.amount),
      button.dataset.label,
      button.dataset.type
    ));
  });

  // Switching units changes display and input settings, not stored amounts.
  function selectUnit(nextUnit) {
    unit = nextUnit;
    try {
      localStorage.setItem(UNIT_KEY, unit);
      notice.textContent = "";
    } catch (error) {
      console.error("Could not save the selected volume unit.", error);
      notice.textContent = "Could not save the selected unit.";
    }
    render();
  }

  mlButton.addEventListener("click", () => selectUnit("mL"));
  lButton.addEventListener("click", () => selectUnit("L"));

  customForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!customForm.reportValidity()) return;
    const amountMl = Math.round(Number(customAmount.value) * (unit === "L" ? 1000 : 1));
    if (amountMl > MAX_INTAKE_ML) {
      notice.textContent = `Enter an amount no greater than ${unit === "L" ? "5 L" : `${MAX_INTAKE_ML.toLocaleString()} mL`}.`;
      customAmount.focus();
      return;
    }
    addEntry(amountMl, "Water");
    if (!notice.textContent) customAmount.value = "";
  });

  containerForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const name = form.querySelector(".container-name");
      const amount = form.querySelector(".container-amount");
      const amountMl = Math.round(Number(amount.value) * (unit === "L" ? 1000 : 1));
      if (addContainer(name.value, amountMl, name)) {
        name.value = "";
        amount.value = "";
      }
    });
  });

  alternativeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!alternativeForm.reportValidity()) return;
    const amountMl = Math.round(Number(alternativeVolume.value) * (unit === "L" ? 1000 : 1));
    if (amountMl > MAX_INTAKE_ML) {
      notice.textContent = `Enter an amount no greater than ${unit === "L" ? "5 L" : `${MAX_INTAKE_ML.toLocaleString()} mL`}.`;
      alternativeVolume.focus();
      return;
    }
    addEntry(amountMl, alternativeName.value.trim(), "alternative");
    if (!notice.textContent) {
      alternativeName.value = "";
      alternativeVolume.value = "";
    }
  });

  goalInput.addEventListener("change", () => {
    const enteredGoal = Number(goalInput.value);
    const goal = Math.round(enteredGoal * (unit === "L" ? 1000 : 1));
    if (!Number.isFinite(enteredGoal) || goal < 1 || goal > 20000 || (unit === "mL" && !Number.isInteger(enteredGoal))) {
      notice.textContent = `Daily goal must be between ${unit === "L" ? "0.001 and 20 L" : "1 and 20,000 mL"}.`;
      goalInput.value = formatGoalInput();
      return;
    }
    const previousGoal = dailyGoal;
    dailyGoal = goal;
    if (saveGoal()) {
      notice.textContent = "";
      render();
    } else {
      dailyGoal = previousGoal;
      goalInput.value = formatGoalInput();
      render();
    }
  });

  // Initialize the dashboard, custom shortcuts, calendar, and history.
  render();
})();
