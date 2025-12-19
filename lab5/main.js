// main.js - основной скрипт для всех страниц сайта
// Содержит общую функциональность, утилиты и обработчики

console.log('Загрузка основного скрипта...');

// === Конфигурация ===
const CONFIG = {
    API_BASE_URL: 'http://localhost:3000',
    SITE_NAME: 'Портфолио Залевской Влады',
    VERSION: '1.0.0',
    DEBUG: true,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 минут
    CACHE_DURATION: 5 * 60 * 1000, // 5 минут
    MAX_API_RETRIES: 3
};

// === Утилиты ===

/**
 * Утилиты для работы с DOM
 */
const DOMUtils = {
    /**
     * Создает элемент с атрибутами
     * @param {string} tag - Тег элемента
     * @param {Object} attributes - Атрибуты элемента
     * @param {string|HTMLElement} content - Содержимое элемента
     * @returns {HTMLElement} Созданный элемент
     */
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        // Устанавливаем атрибуты
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key === 'dataset' && typeof value === 'object') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Устанавливаем содержимое
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        } else if (Array.isArray(content)) {
            content.forEach(item => {
                if (item instanceof HTMLElement) {
                    element.appendChild(item);
                }
            });
        }
        
        return element;
    },
    
    /**
     * Показывает элемент
     * @param {HTMLElement} element - Элемент
     * @param {string} display - Значение display
     */
    show(element, display = 'block') {
        if (element) {
            element.style.display = display;
        }
    },
    
    /**
     * Скрывает элемент
     * @param {HTMLElement} element - Элемент
     */
    hide(element) {
        if (element) {
            element.style.display = 'none';
        }
    },
    
    /**
     * Переключает видимость элемента
     * @param {HTMLElement} element - Элемент
     * @param {boolean} force - Принудительное состояние
     */
    toggle(element, force) {
        if (element) {
            if (force !== undefined) {
                element.style.display = force ? 'block' : 'none';
            } else {
                element.style.display = element.style.display === 'none' ? 'block' : 'none';
            }
        }
    },
    
    /**
     * Добавляет классы элементу
     * @param {HTMLElement} element - Элемент
     * @param {...string} classNames - Классы
     */
    addClass(element, ...classNames) {
        if (element) {
            element.classList.add(...classNames);
        }
    },
    
    /**
     * Удаляет классы элемента
     * @param {HTMLElement} element - Элемент
     * @param {...string} classNames - Классы
     */
    removeClass(element, ...classNames) {
        if (element) {
            element.classList.remove(...classNames);
        }
    },
    
    /**
     * Проверяет наличие класса
     * @param {HTMLElement} element - Элемент
     * @param {string} className - Класс
     * @returns {boolean} true если класс есть
     */
    hasClass(element, className) {
        return element && element.classList.contains(className);
    },
    
    /**
     * Находит родительский элемент с классом
     * @param {HTMLElement} element - Элемент
     * @param {string} className - Класс
     * @returns {HTMLElement|null} Родительский элемент
     */
    findParentWithClass(element, className) {
        let current = element;
        while (current && current !== document.body) {
            if (current.classList && current.classList.contains(className)) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    },
    
    /**
     * Устанавливает текст элемента с безопасной обработкой
     * @param {HTMLElement} element - Элемент
     * @param {string} text - Текст
     */
    setText(element, text) {
        if (element) {
            element.textContent = text;
        }
    },
    
    /**
     * Устанавливает HTML элемента с безопасной обработкой
     * @param {HTMLElement} element - Элемент
     * @param {string} html - HTML
     */
    setHTML(element, html) {
        if (element) {
            element.innerHTML = this.sanitizeHTML(html);
        }
    },
    
    /**
     * Очищает HTML от потенциально опасных тегов
     * @param {string} html - HTML
     * @returns {string} Безопасный HTML
     */
    sanitizeHTML(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    },
    
    /**
     * Создает и показывает уведомление
     * @param {string} message - Сообщение
     * @param {string} type - Тип (success, error, info, warning)
     * @param {number} duration - Длительность в ms
     */
    showNotification(message, type = 'info', duration = 3000) {
        if (window.notificationManager) {
            return window.notificationManager[type](message, duration);
        }
        
        // Fallback уведомление
        const notification = this.createElement('div', {
            className: `notification notification-${type}`,
            style: {
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '12px 16px',
                backgroundColor: this.getNotificationColor(type),
                color: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: '10000',
                animation: 'slideIn 0.3s ease'
            }
        }, message);
        
        document.body.appendChild(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, duration);
        }
        
        return notification;
    },
    
    /**
     * Возвращает цвет для уведомления
     * @param {string} type - Тип уведомления
     * @returns {string} Цвет
     */
    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }
};

/**
 * Утилиты для работы с localStorage
 */
const StorageUtils = {
    /**
     * Сохраняет данные в localStorage
     * @param {string} key - Ключ
     * @param {any} value - Значение
     * @param {number} ttl - Время жизни в ms
     */
    set(key, value, ttl = null) {
        try {
            const item = {
                value: value,
                timestamp: Date.now(),
                ttl: ttl
            };
            localStorage.setItem(key, JSON.stringify(item));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
            return false;
        }
    },
    
    /**
     * Получает данные из localStorage
     * @param {string} key - Ключ
     * @returns {any} Значение или null
     */
    get(key) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            
            const parsed = JSON.parse(item);
            
            // Проверяем TTL
            if (parsed.ttl && Date.now() - parsed.timestamp > parsed.ttl) {
                localStorage.removeItem(key);
                return null;
            }
            
            return parsed.value;
        } catch (error) {
            console.error('Ошибка чтения из localStorage:', error);
            return null;
        }
    },
    
    /**
     * Удаляет данные из localStorage
     * @param {string} key - Ключ
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Ошибка удаления из localStorage:', error);
            return false;
        }
    },
    
    /**
     * Очищает все данные сайта из localStorage
     */
    clear() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('user') || key.startsWith('app_')) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log('Данные приложения очищены из localStorage');
            return true;
        } catch (error) {
            console.error('Ошибка очистки localStorage:', error);
            return false;
        }
    },
    
    /**
     * Получает статистику использования localStorage
     * @returns {Object} Статистика
     */
    getStats() {
        try {
            let totalSize = 0;
            const items = {};
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                const size = (key.length + value.length) * 2; // UTF-16
                totalSize += size;
                items[key] = {
                    size: size,
                    value: value.substring(0, 50) + (value.length > 50 ? '...' : '')
                };
            }
            
            return {
                totalItems: localStorage.length,
                totalSize: totalSize,
                items: items,
                maxSize: 5 * 1024 * 1024 // 5MB
            };
        } catch (error) {
            console.error('Ошибка получения статистики localStorage:', error);
            return null;
        }
    }
};

/**
 * Утилиты для работы с API
 */
const ApiUtils = {
    /**
     * Выполняет GET запрос
     * @param {string} endpoint - Эндпоинт
     * @param {Object} options - Опции
     * @returns {Promise<any>} Результат
     */
    async get(endpoint, options = {}) {
        return this.request('GET', endpoint, null, options);
    },
    
    /**
     * Выполняет POST запрос
     * @param {string} endpoint - Эндпоинт
     * @param {Object} data - Данные
     * @param {Object} options - Опции
     * @returns {Promise<any>} Результат
     */
    async post(endpoint, data, options = {}) {
        return this.request('POST', endpoint, data, options);
    },
    
    /**
     * Выполняет запрос к API
     * @param {string} method - HTTP метод
     * @param {string} endpoint - Эндпоинт
     * @param {Object} data - Данные
     * @param {Object} options - Опции
     * @returns {Promise<any>} Результат
     */
    async request(method, endpoint, data = null, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers
        };
        
        const config = {
            method: method,
            headers: headers,
            credentials: 'include',
            ...options
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(data);
        }
        
        // Логирование запроса в debug режиме
        if (CONFIG.DEBUG) {
            console.log(`API ${method} запрос:`, {
                url: url,
                data: data,
                config: config
            });
        }
        
        let retries = 0;
        const maxRetries = options.maxRetries || CONFIG.MAX_API_RETRIES;
        
        while (retries <= maxRetries) {
            try {
                const startTime = performance.now();
                const response = await fetch(url, config);
                const requestTime = performance.now() - startTime;
                
                if (CONFIG.DEBUG) {
                    console.log(`API ответ (${requestTime.toFixed(2)}ms):`, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries())
                    });
                }
                
                // Обработка HTTP ошибок
                if (!response.ok) {
                    const errorData = await this.parseResponse(response);
                    throw new ApiError(
                        errorData.message || `HTTP error ${response.status}`,
                        response.status,
                        errorData
                    );
                }
                
                // Парсинг успешного ответа
                const result = await this.parseResponse(response);
                
                if (CONFIG.DEBUG) {
                    console.log('API данные:', result);
                }
                
                return {
                    success: true,
                    data: result,
                    status: response.status,
                    headers: response.headers,
                    time: requestTime,
                    timestamp: new Date().toISOString()
                };
                
            } catch (error) {
                retries++;
                
                // Если это последняя попытка или ошибка не сетевого характера
                if (retries > maxRetries || !this.isNetworkError(error)) {
                    console.error(`API ошибка (попытка ${retries}/${maxRetries}):`, error);
                    
                    if (CONFIG.DEBUG && window.notificationManager) {
                        window.notificationManager.error(`API ошибка: ${error.message}`);
                    }
                    
                    throw error;
                }
                
                // Ждем перед повторной попыткой
                await this.sleep(Math.pow(2, retries) * 100); // Экспоненциальная задержка
                
                if (CONFIG.DEBUG) {
                    console.log(`Повторная попытка API (${retries}/${maxRetries})...`);
                }
            }
        }
    },
    
    /**
     * Парсит ответ сервера
     * @param {Response} response - Ответ
     * @returns {Promise<any>} Парсированные данные
     */
    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else if (contentType && contentType.includes('text/')) {
            return response.text();
        } else {
            return response.blob();
        }
    },
    
    /**
     * Проверяет, является ли ошибка сетевой
     * @param {Error} error - Ошибка
     * @returns {boolean} true если сетевая ошибка
     */
    isNetworkError(error) {
        return error instanceof TypeError || // Network error
               error.message.includes('Network') ||
               error.message.includes('Failed to fetch') ||
               error.message.includes('Network request failed');
    },
    
    /**
     * Пауза выполнения
     * @param {number} ms - Миллисекунды
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Проверяет доступность API
     * @returns {Promise<boolean>} true если API доступен
     */
    async checkApiHealth() {
        try {
            const response = await fetch(CONFIG.API_BASE_URL, {
                method: 'HEAD',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
};

/**
 * Класс ошибки API
 */
class ApiError extends Error {
    constructor(message, status = 500, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
        this.timestamp = new Date().toISOString();
    }
    
    toString() {
        return `${this.name}: ${this.message} (Status: ${this.status})`;
    }
}

/**
 * Утилиты для работы с датами и временем
 */
const TimeUtils = {
    /**
     * Форматирует дату
     * @param {Date|string|number} date - Дата
     * @param {string} format - Формат
     * @returns {string} Отформатированная дата
     */
    formatDate(date, format = 'ru-RU') {
        const d = new Date(date);
        
        if (format === 'ru-RU') {
            return d.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } else if (format === 'iso') {
            return d.toISOString();
        } else if (format === 'time') {
            return d.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (format === 'datetime') {
            return d.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return d.toString();
    },
    
    /**
     * Возвращает относительное время
     * @param {Date|string|number} date - Дата
     * @returns {string} Относительное время
     */
    timeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diff = now - past;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);
        
        if (years > 0) return `${years} ${this.pluralize(years, 'год', 'года', 'лет')} назад`;
        if (months > 0) return `${months} ${this.pluralize(months, 'месяц', 'месяца', 'месяцев')} назад`;
        if (days > 0) return `${days} ${this.pluralize(days, 'день', 'дня', 'дней')} назад`;
        if (hours > 0) return `${hours} ${this.pluralize(hours, 'час', 'часа', 'часов')} назад`;
        if (minutes > 0) return `${minutes} ${this.pluralize(minutes, 'минуту', 'минуты', 'минут')} назад`;
        
        return 'только что';
    },
    
    /**
     * Склоняет слова по числам
     * @param {number} n - Число
     * @param {string} one - Форма для 1
     * @param {string} few - Форма для 2-4
     * @param {string} many - Форма для 5-20
     * @returns {string} Правильная форма
     */
    pluralize(n, one, few, many) {
        n = Math.abs(n) % 100;
        const n1 = n % 10;
        
        if (n > 10 && n < 20) return many;
        if (n1 > 1 && n1 < 5) return few;
        if (n1 === 1) return one;
        return many;
    },
    
    /**
     * Форматирует длительность
     * @param {number} ms - Миллисекунды
     * @returns {string} Отформатированная длительность
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        } else if (minutes > 0) {
            return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
        } else {
            return `${seconds} сек`;
        }
    }
};

/**
 * Утилиты для отладки и логирования
 */
const DebugUtils = {
    /**
     * Логирует сообщение в консоль
     * @param {string} message - Сообщение
     * @param {string} level - Уровень (log, info, warn, error)
     * @param {any} data - Данные
     */
    log(message, level = 'log', data = null) {
        if (!CONFIG.DEBUG && level === 'log') return;
        
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
        
        if (data) {
            console[level](prefix, message, data);
        } else {
            console[level](prefix, message);
        }
    },
    
    /**
     * Замеряет время выполнения функции
     * @param {Function} fn - Функция
     * @param {string} label - Метка
     * @returns {any} Результат функции
     */
    time(fn, label = 'Execution') {
        const startTime = performance.now();
        const result = fn();
        const endTime = performance.now();
        
        this.log(`${label} заняло ${(endTime - startTime).toFixed(2)}ms`, 'info');
        return result;
    },
    
    /**
     * Асинхронный замер времени выполнения функции
     * @param {Function} fn - Асинхронная функция
     * @param {string} label - Метка
     * @returns {Promise<any>} Результат функции
     */
    async timeAsync(fn, label = 'Async Execution') {
        const startTime = performance.now();
        const result = await fn();
        const endTime = performance.now();
        
        this.log(`${label} заняло ${(endTime - startTime).toFixed(2)}ms`, 'info');
        return result;
    },
    
    /**
     * Сохраняет данные для отладки
     * @param {string} key - Ключ
     * @param {any} data - Данные
     */
    saveDebugData(key, data) {
        try {
            const debugData = StorageUtils.get('debug_data') || {};
            debugData[key] = {
                data: data,
                timestamp: new Date().toISOString(),
                page: window.location.pathname
            };
            StorageUtils.set('debug_data', debugData);
        } catch (error) {
            console.error('Ошибка сохранения отладочных данных:', error);
        }
    },
    
    /**
     * Получает сохраненные отладочные данные
     * @returns {Object} Данные
     */
    getDebugData() {
        return StorageUtils.get('debug_data') || {};
    },
    
    /**
     * Очищает отладочные данные
     */
    clearDebugData() {
        StorageUtils.remove('debug_data');
    }
};

// === Основная логика приложения ===

/**
 * Менеджер состояния приложения
 */
class AppStateManager {
    constructor() {
        this.state = {
            currentPage: window.location.pathname,
            user: null,
            lastActivity: Date.now(),
            notifications: [],
            settings: this.loadSettings()
        };
        
        this.init();
    }
    
    /**
     * Инициализация менеджера состояния
     */
    init() {
        // Восстанавливаем состояние из localStorage
        const savedState = StorageUtils.get('app_state');
        if (savedState) {
            this.state = { ...this.state, ...savedState };
        }
        
        // Отслеживаем активность пользователя
        this.setupActivityTracking();
        
        // Отслеживаем изменения страницы
        this.setupPageTracking();
        
        DebugUtils.log('Менеджер состояния инициализирован', 'info', {
            page: this.state.currentPage,
            hasUser: !!this.state.user
        });
    }
    
    /**
     * Настраивает отслеживание активности
     */
    setupActivityTracking() {
        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                this.state.lastActivity = Date.now();
                this.saveState();
            }, { passive: true });
        });
        
        // Проверяем неактивность каждую минуту
        setInterval(() => {
            const inactiveTime = Date.now() - this.state.lastActivity;
            if (inactiveTime > CONFIG.SESSION_TIMEOUT) {
                this.handleInactivity();
            }
        }, 60000);
    }
    
    /**
     * Настраивает отслеживание страниц
     */
    setupPageTracking() {
        // Отслеживаем изменения URL через History API
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function(state, title, url) {
            originalPushState.apply(this, arguments);
            window.dispatchEvent(new Event('statechange'));
        };
        
        history.replaceState = function(state, title, url) {
            originalReplaceState.apply(this, arguments);
            window.dispatchEvent(new Event('statechange'));
        };
        
        window.addEventListener('popstate', () => {
            window.dispatchEvent(new Event('statechange'));
        });
        
        window.addEventListener('statechange', () => {
            this.state.currentPage = window.location.pathname;
            this.saveState();
            DebugUtils.log('Страница изменена', 'info', { page: this.state.currentPage });
        });
    }
    
    /**
     * Обрабатывает неактивность пользователя
     */
    handleInactivity() {
        DebugUtils.log('Пользователь неактивен', 'warn', {
            inactiveTime: TimeUtils.formatDuration(Date.now() - this.state.lastActivity)
        });
        
        if (window.notificationManager) {
            window.notificationManager.warning('Вы неактивны продолжительное время');
        }
    }
    
    /**
     * Загружает настройки
     * @returns {Object} Настройки
     */
    loadSettings() {
        return StorageUtils.get('app_settings') || {
            theme: 'light',
            notifications: true,
            animations: true,
            language: 'ru'
        };
    }
    
    /**
     * Сохраняет настройки
     * @param {Object} settings - Настройки
     */
    saveSettings(settings) {
        this.state.settings = { ...this.state.settings, ...settings };
        StorageUtils.set('app_settings', this.state.settings);
        this.applySettings();
    }
    
    /**
     * Применяет настройки
     */
    applySettings() {
        // Применяем тему
        document.documentElement.setAttribute('data-theme', this.state.settings.theme);
        
        // Применяем анимации
        if (!this.state.settings.animations) {
            document.documentElement.classList.add('no-animations');
        } else {
            document.documentElement.classList.remove('no-animations');
        }
        
        DebugUtils.log('Настройки применены', 'info', this.state.settings);
    }
    
    /**
     * Сохраняет состояние
     */
    saveState() {
        StorageUtils.set('app_state', this.state, CONFIG.SESSION_TIMEOUT);
    }
    
    /**
     * Устанавливает пользователя
     * @param {Object} user - Данные пользователя
     */
    setUser(user) {
        this.state.user = user;
        this.saveState();
        window.dispatchEvent(new CustomEvent('userChanged', { detail: user }));
        DebugUtils.log('Пользователь установлен', 'info', user);
    }
    
    /**
     * Получает текущего пользователя
     * @returns {Object|null} Пользователь
     */
    getUser() {
        return this.state.user;
    }
    
    /**
     * Очищает состояние
     */
    clear() {
        this.state = {
            currentPage: window.location.pathname,
            user: null,
            lastActivity: Date.now(),
            notifications: [],
            settings: this.state.settings
        };
        StorageUtils.remove('app_state');
        DebugUtils.log('Состояние очищено', 'info');
    }
    
    /**
     * Получает статистику состояния
     * @returns {Object} Статистика
     */
    getStats() {
        return {
            currentPage: this.state.currentPage,
            hasUser: !!this.state.user,
            lastActivity: TimeUtils.timeAgo(this.state.lastActivity),
            notificationCount: this.state.notifications.length,
            settings: this.state.settings,
            sessionDuration: TimeUtils.formatDuration(Date.now() - (StorageUtils.get('session_start') || Date.now()))
        };
    }
}

/**
 * Обработчик навигации
 */
class NavigationHandler {
    constructor() {
        this.currentPage = window.location.pathname;
        this.init();
    }
    
    /**
     * Инициализация
     */
    init() {
        this.highlightCurrentPage();
        this.setupNavigationEvents();
        this.addNavigationAnalytics();
        DebugUtils.log('Обработчик навигации инициализирован', 'info');
    }
    
    /**
     * Подсвечивает текущую страницу в навигации
     */
    highlightCurrentPage() {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === this.currentPage || 
                (href !== 'index.html' && this.currentPage.includes(href.replace('.html', '')))) {
                DOMUtils.addClass(link, 'active');
                link.setAttribute('aria-current', 'page');
            } else {
                DOMUtils.removeClass(link, 'active');
                link.removeAttribute('aria-current');
            }
        });
    }
    
    /**
     * Настраивает события навигации
     */
    setupNavigationEvents() {
        // Предотвращаем переход по ссылкам, если форма заполнена
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                this.handleNavigationClick(e, link);
            });
        });
        
        // Обработка кнопок назад/вперед
        window.addEventListener('popstate', () => {
            this.currentPage = window.location.pathname;
            this.highlightCurrentPage();
            this.trackPageView();
        });
    }
    
    /**
     * Обрабатывает клик по навигации
     * @param {Event} e - Событие
     * @param {HTMLElement} link - Ссылка
     */
    handleNavigationClick(e, link) {
        const href = link.getAttribute('href');
        const target = link.getAttribute('target');
        
        // Если ссылка ведет на внешний ресурс или открывается в новой вкладке
        if (target === '_blank' || href.startsWith('http')) {
            this.trackExternalLink(href);
            return;
        }
        
        // Проверяем, не заполнена ли форма на странице логина
        if (this.currentPage.includes('login.html') && this.isFormDirty()) {
            const confirmLeave = confirm('У вас есть несохраненные данные. Вы уверены, что хотите уйти со страницы?');
            if (!confirmLeave) {
                e.preventDefault();
                return;
            }
        }
        
        // Отслеживаем переход
        this.trackNavigation(href);
        
        DebugUtils.log('Навигация', 'info', {
            from: this.currentPage,
            to: href,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Проверяет, есть ли несохраненные данные в форме
     * @returns {boolean} true если форма заполнена
     */
    isFormDirty() {
        const form = document.querySelector('form');
        if (!form) return false;
        
        const inputs = form.querySelectorAll('input, textarea, select');
        return Array.from(inputs).some(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                return input.checked !== input.defaultChecked;
            }
            return input.value !== input.defaultValue;
        });
    }
    
    /**
     * Добавляет аналитику навигации
     */
    addNavigationAnalytics() {
        const navStats = StorageUtils.get('navigation_stats') || {
            totalClicks: 0,
            pages: {},
            lastVisit: null
        };
        
        navStats.totalClicks++;
        navStats.lastVisit = new Date().toISOString();
        
        if (!navStats.pages[this.currentPage]) {
            navStats.pages[this.currentPage] = 0;
        }
        navStats.pages[this.currentPage]++;
        
        StorageUtils.set('navigation_stats', navStats);
    }
    
    /**
     * Отслеживает переход
     * @param {string} to - Целевая страница
     */
    trackNavigation(to) {
        const navigation = StorageUtils.get('navigation_history') || [];
        navigation.push({
            from: this.currentPage,
            to: to,
            timestamp: new Date().toISOString(),
            referrer: document.referrer
        });
        
        // Ограничиваем историю 100 записями
        if (navigation.length > 100) {
            navigation.shift();
        }
        
        StorageUtils.set('navigation_history', navigation);
    }
    
    /**
     * Отслеживает внешние ссылки
     * @param {string} url - URL
     */
    trackExternalLink(url) {
        const externalLinks = StorageUtils.get('external_links') || [];
        externalLinks.push({
            url: url,
            timestamp: new Date().toISOString(),
            page: this.currentPage
        });
        
        StorageUtils.set('external_links', externalLinks);
        
        DebugUtils.log('Внешняя ссылка', 'info', { url, page: this.currentPage });
    }
    
    /**
     * Отслеживает просмотр страницы
     */
    trackPageView() {
        const pageViews = StorageUtils.get('page_views') || {};
        
        if (!pageViews[this.currentPage]) {
            pageViews[this.currentPage] = 0;
        }
        pageViews[this.currentPage]++;
        
        StorageUtils.set('page_views', pageViews);
        
        DebugUtils.log('Просмотр страницы', 'info', {
            page: this.currentPage,
            views: pageViews[this.currentPage],
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Получает статистику навигации
     * @returns {Object} Статистика
     */
    getStats() {
        return {
            navigationStats: StorageUtils.get('navigation_stats') || {},
            pageViews: StorageUtils.get('page_views') || {},
            navigationHistory: StorageUtils.get('navigation_history') || [],
            externalLinks: StorageUtils.get('external_links') || []
        };
    }
}

// === Инициализация приложения ===

// Глобальные экземпляры
window.AppUtils = {
    DOM: DOMUtils,
    Storage: StorageUtils,
    API: ApiUtils,
    Time: TimeUtils,
    Debug: DebugUtils,
    Config: CONFIG
};

let appStateManager = null;
let navigationHandler = null;

/**
 * Инициализирует приложение
 */
function initApp() {
    console.log('Инициализация приложения...');
    
    try {
        // Инициализация менеджера состояния
        appStateManager = new AppStateManager();
        
        // Инициализация обработчика навигации
        navigationHandler = new NavigationHandler();
        
        // Отслеживаем просмотр текущей страницы
        navigationHandler.trackPageView();
        
        // Применяем настройки
        appStateManager.applySettings();
        
        // Проверяем API
        checkApiAvailability();
        
        // Устанавливаем глобальные обработчики ошибок
        setupErrorHandling();
        
        // Добавляем стили для анимаций
        addAnimationStyles();
        
        console.log('Приложение успешно инициализировано');
        
        // Отправляем событие о готовности
        window.dispatchEvent(new CustomEvent('appReady', {
            detail: {
                timestamp: new Date().toISOString(),
                version: CONFIG.VERSION,
                config: CONFIG
            }
        }));
        
        if (window.notificationManager) {
            window.notificationManager.info('Приложение готово к работе', 2000);
        }
        
    } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
        
        if (window.notificationManager) {
            window.notificationManager.error('Ошибка инициализации приложения');
        }
    }
}

/**
 * Проверяет доступность API
 */
async function checkApiAvailability() {
    try {
        const isAvailable = await ApiUtils.checkApiHealth();
        
        if (!isAvailable && CONFIG.DEBUG) {
            console.warn('API недоступен. Убедитесь, что сервер запущен на', CONFIG.API_BASE_URL);
            
            if (window.notificationManager) {
                window.notificationManager.warning('API сервер недоступен. Некоторые функции могут не работать.');
            }
        } else if (CONFIG.DEBUG) {
            console.log('API доступен:', CONFIG.API_BASE_URL);
        }
    } catch (error) {
        console.error('Ошибка проверки API:', error);
    }
}

/**
 * Настраивает обработку ошибок
 */
function setupErrorHandling() {
    // Обработчик ошибок JavaScript
    window.addEventListener('error', (event) => {
        console.error('JavaScript ошибка:', event.error);
        
        // Сохраняем ошибку для отладки
        const errors = StorageUtils.get('js_errors') || [];
        errors.push({
            message: event.error.message,
            stack: event.error.stack,
            timestamp: new Date().toISOString(),
            url: event.filename,
            line: event.lineno,
            column: event.colno
        });
        
        if (errors.length > 50) errors.shift();
        StorageUtils.set('js_errors', errors);
        
        // Показываем пользователю только в debug режиме
        if (CONFIG.DEBUG && window.notificationManager) {
            window.notificationManager.error(`JS ошибка: ${event.error.message}`);
        }
        
        // Не предотвращаем стандартную обработку
        return false;
    });
    
    // Обработчик необработанных промисов
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Необработанный промис:', event.reason);
        
        const rejections = StorageUtils.get('promise_rejections') || [];
        rejections.push({
            reason: event.reason?.message || String(event.reason),
            timestamp: new Date().toISOString()
        });
        
        if (rejections.length > 50) rejections.shift();
        StorageUtils.set('promise_rejections', rejections);
        
        if (CONFIG.DEBUG && window.notificationManager) {
            window.notificationManager.error(`Ошибка промиса: ${event.reason?.message || 'Unknown error'}`);
        }
    });
}

/**
 * Добавляет стили для анимаций
 */
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .no-animations * {
            animation: none !important;
            transition: none !important;
        }
        
        [data-theme="dark"] {
            color-scheme: dark;
        }
        
        [data-theme="light"] {
            color-scheme: light;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Показывает информацию о приложении
 */
function showAppInfo() {
    if (CONFIG.DEBUG) {
        console.log('=== Информация о приложении ===');
        console.log('Версия:', CONFIG.VERSION);
        console.log('API:', CONFIG.API_BASE_URL);
        console.log('Текущая страница:', window.location.pathname);
        console.log('User Agent:', navigator.userAgent);
        console.log('Платформа:', navigator.platform);
        console.log('Онлайн:', navigator.onLine);
        console.log('=============================');
    }
}

// === Запуск приложения ===

// Ждем полной загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initApp();
        showAppInfo();
    });
} else {
    initApp();
    showAppInfo();
}

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppUtils,
        ApiError,
        initApp,
        appStateManager,
        navigationHandler
    };
}

// Глобальный доступ
window.appStateManager = appStateManager;
window.navigationHandler = navigationHandler;
window.initApp = initApp;

console.log('Основной скрипт загружен');