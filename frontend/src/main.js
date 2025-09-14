import './app.css';

// --- Selectors ---
const taskInput = document.getElementById("taskInput");
const addButton = document.getElementById("addTaskButton");
const taskList = document.getElementById("taskList");
const completedTaskList = document.getElementById("completedTaskList");
const taskDate = document.getElementById("taskDate");
const taskPriority = document.getElementById("taskPriority");
const errorMsg = document.getElementById("errorMsg");

const confirmModal = document.getElementById("confirmModal");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let taskToDeleteIndex = null;

// --- Theme toggle ---
document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("themeToggle");
    const body = document.body;
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
        body.setAttribute("data-theme", savedTheme);
        updateButtonText(savedTheme);
    } else updateButtonText("light");

    themeToggle.addEventListener("click", () => {
        const newTheme = body.getAttribute("data-theme") === "dark" ? "light" : "dark";
        body.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateButtonText(newTheme);
    });

   function updateButtonText(theme) {
    themeToggle.textContent = theme === "dark" ? "🌙 Dark Theme" : "☀️ Light Theme";
}

});

// --- Add task ---
addButton.addEventListener("click", () => {
    const text = taskInput.value.trim();
    const date = taskDate.value;
    const priority = taskPriority.value;

    if (!text) {
        errorMsg.textContent = "Пожалуйста, введите текст задачи!";
        setTimeout(() => errorMsg.textContent = "", 3000);
        return;
    }

    tasks.push({ text, completed: false, date, priority });
    sortTasksByPriority();
    saveTasks();
    renderTasks();

    taskInput.value = "";
    taskDate.value = "";
    taskPriority.value = "medium";
});

// --- Sort tasks ---
function sortTasksByPriority() {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    tasks.sort((a, b) => {
        const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (diff !== 0) return diff;
        if (a.date && b.date) return new Date(a.date) - new Date(b.date);
        if (a.date) return -1;
        if (b.date) return 1;
        return 0;
    });
}



const statusFilter = document.getElementById("statusFilter");
const dateFilter = document.getElementById("dateFilter");
const priorityFilter = document.getElementById("priorityFilter");


// --- Render tasks ---
function renderTasks() {
    taskList.innerHTML = "";
    completedTaskList.innerHTML = "";

    const statusValue = statusFilter.value;
    const dateValue = dateFilter.value;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

    tasks.forEach((task, index) => {
        let show = true;

       
        if (statusValue === "active" && task.completed) show = false;
        if (statusValue === "completed" && !task.completed) show = false;
        // --- Фильтр по приоритету ---
if (priorityFilter.value !== "all" && task.priority !== priorityFilter.value) {
    show = false;
}


        // --- Фильтр по дате ---
        if (task.date) {
            const taskDateObj = new Date(task.date);

            if (dateValue === "today") {
                if (!(taskDateObj >= startOfToday && taskDateObj < endOfToday)) {
                    show = false;
                }
            }
            if (dateValue === "week") {
                if (!(taskDateObj >= startOfToday && taskDateObj <= endOfWeek)) {
                    show = false;
                }
            }
            if (dateValue === "overdue") {
                if (taskDateObj >= startOfToday) {
                    show = false;
                }
            }
        } else {
            if (dateValue !== "all") {
                show = false; 
            }
        }

        if (!show) return; 

        // --- Создание элемента задачи ---
        const li = document.createElement("li");
        li.setAttribute("data-priority", task.priority);
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";

        const span = document.createElement("span");
        span.textContent = task.text;

        const info = document.createElement("small");
       info.style.display = "block";
info.style.fontSize = "0.8em";
info.style.color = "gray";
if (task.date) {
    const taskDateObj = new Date(task.date);
    const day = String(taskDateObj.getDate()).padStart(2, '0');
    const month = String(taskDateObj.getMonth() + 1).padStart(2, '0'); 
    const year = taskDateObj.getFullYear();
    const hours = String(taskDateObj.getHours()).padStart(2, '0');
    const minutes = String(taskDateObj.getMinutes()).padStart(2, '0');
    info.textContent = `Date: ${day}.${month}.${year} ${hours}:${minutes}, Priority: ${task.priority}`;
} else {
    info.textContent = `Priority: ${task.priority}`;
}




        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = task.completed ? "Undo" : "Done";
        toggleBtn.addEventListener("click", () => toggleTask(index));

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => removeTask(index));

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "task-buttons";
        buttonContainer.appendChild(toggleBtn);
        buttonContainer.appendChild(deleteBtn);

        li.appendChild(span);
        li.appendChild(info);
        li.appendChild(buttonContainer);

        if (task.completed) {
    li.classList.add("completed"); 
    completedTaskList.appendChild(li);
} else {
    taskList.appendChild(li);
}

    });
}

// --- Перерисовываем при смене фильтра ---
statusFilter.addEventListener("change", renderTasks);
dateFilter.addEventListener("change", renderTasks);
priorityFilter.addEventListener("change", renderTasks);



// --- Toggle task completion ---
function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

// --- Remove task with confirmation ---
function removeTask(index) {
    taskToDeleteIndex = index;
    confirmModal.style.display = "flex";
}

confirmYes.addEventListener("click", () => {
    if (taskToDeleteIndex !== null) {
        tasks.splice(taskToDeleteIndex, 1);
        saveTasks();
        renderTasks();
        taskToDeleteIndex = null;
        confirmModal.style.display = "none";
    }
});

confirmNo.addEventListener("click", () => {
    taskToDeleteIndex = null;
    confirmModal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === confirmModal) {
        taskToDeleteIndex = null;
        confirmModal.style.display = "none";
    }
});

// --- Save to localStorage ---
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// --- Initial render ---
renderTasks();
