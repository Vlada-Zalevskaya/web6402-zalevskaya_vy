
document.addEventListener('DOMContentLoaded', () => {
    console.log('Страница авторизации загружена');
    
    // Инициализация классов
    const userLogin = new UserLogin();
    const userRegister = new UserRegister();
    
    // Конфигурация API
    const API_BASE_URL = 'http://localhost:3000';
    
    // Состояние приложения
    let appState = {
        isFormValid: false,
        isSubmitting: false,
        lastValidation: null,
        apiCalls: 0
    };
    
    // === DOM элементы ===
    
    // Форма
    const form = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const agreeCheckbox = document.getElementById('agree');
    const submitBtn = document.getElementById('submitBtn');
    const formStatus = document.getElementById('formStatus');
    
    // Подсказки и ошибки
    const usernameHint = document.getElementById('usernameHint');
    const usernameError = document.getElementById('usernameError');
    const emailHint = document.getElementById('emailHint');
    const emailError = document.getElementById('emailError');
    const passwordHint = document.getElementById('passwordHint');
    const passwordError = document.getElementById('passwordError');
    const agreeError = document.getElementById('agreeError');
    
    // Элементы тестирования API
    const testEducationBtn = document.getElementById('testEducationBtn');
    const testAddCourseBtn = document.getElementById('testAddCourseBtn');
    const testSkillsBtn = document.getElementById('testSkillsBtn');
    const apiStatus = document.getElementById('apiStatus');
    const apiDataContainer = document.getElementById('apiDataContainer');
    const apiDataPreview = document.getElementById('apiDataPreview');
    
    // === Класс валидатора формы (Требование 1) ===
    
    class FormValidator {
        constructor() {
            this.errors = {
                username: '',
                email: '',
                password: '',
                agree: ''
            };
            this.validationHistory = [];
        }
        
        /**
         * Валидирует имя пользователя
         * @param {string} username - Имя пользователя
         * @returns {string} Сообщение об ошибке
         */
        validateUsername(username) {
            const value = username.trim();
            
            if (!value) {
                return 'Логин обязателен';
            }
            
            if (value.length < 3) {
                return 'Логин должен быть не менее 3 символов';
            }
            
            if (value.length > 20) {
                return 'Логин должен быть не более 20 символов';
            }
            
            if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                return 'Логин может содержать только буквы, цифры и подчеркивание';
            }
            
            return '';
        }
        
        /**
         * Валидирует email
         * @param {string} email - Email
         * @returns {string} Сообщение об ошибке
         */
        validateEmail(email) {
            const value = email.trim();
            
            if (!value) {
                return 'Email обязателен';
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Введите корректный email';
            }
            
            return '';
        }
        
        /**
         * Валидирует пароль
         * @param {string} password - Пароль
         * @returns {string} Сообщение об ошибке
         */
        validatePassword(password) {
            if (!password) {
                return 'Пароль обязателен';
            }
            
            const errors = [];
            
            if (password.length < 8) {
                errors.push('не менее 8 символов');
            }
            
            if (!/\d/.test(password)) {
                errors.push('хотя бы одну цифру');
            }
            
            if (!/[a-zA-Z]/.test(password)) {
                errors.push('хотя бы одну букву');
            }
            
            if (errors.length > 0) {
                return `Пароль должен содержать: ${errors.join(', ')}`;
            }
            
            return '';
        }
        
        /**
         * Валидирует согласие
         * @param {boolean} agree - Согласие
         * @returns {string} Сообщение об ошибке
         */
        validateAgreement(agree) {
            if (!agree) {
                return 'Необходимо согласие на обработку данных';
            }
            return '';
        }
        
        /**
         * Валидирует все поля
         * @param {Object} data - Данные формы
         * @returns {boolean} true если все поля валидны
         */
        validateAll(data) {
            this.errors.username = this.validateUsername(data.username);
            this.errors.email = this.validateEmail(data.email);
            this.errors.password = this.validatePassword(data.password);
            this.errors.agree = this.validateAgreement(data.agree);
            
            const isValid = !Object.values(this.errors).some(error => error);
            
            // Сохраняем историю валидации
            this.validationHistory.push({
                timestamp: new Date().toISOString(),
                data: { ...data, password: '***' },
                errors: { ...this.errors },
                isValid: isValid
            });
            
            // Ограничиваем историю 50 записями
            if (this.validationHistory.length > 50) {
                this.validationHistory.shift();
            }
            
            return isValid;
        }
        
        /**
         * Получает статистику валидации
         * @returns {Object} Статистика
         */
        getValidationStats() {
            const total = this.validationHistory.length;
            const valid = this.validationHistory.filter(v => v.isValid).length;
            
            return {
                totalValidations: total,
                valid: valid,
                invalid: total - valid,
                successRate: total > 0 ? (valid / total * 100).toFixed(2) : 0,
                lastValidation: this.validationHistory[this.validationHistory.length - 1] || null
            };
        }
    }
    
    // === Класс менеджера формы ===
    
    class FormManager {
        constructor() {
            this.validator = new FormValidator();
            this.isSubmitting = false;
            this.initEventListeners();
            this.initPerformanceMonitoring();
        }
        
        /**
         * Инициализирует обработчики событий (Требование 1 - динамическая проверка)
         */
        initEventListeners() {
            console.log('Инициализация обработчиков событий формы');
            
            // Динамическая валидация имени пользователя
            usernameInput.addEventListener('input', (e) => {
                this.validateField('username', e.target.value);
                this.showHint('username', 'Используйте латинские буквы и цифры (3-20 символов)');
            });
            
            usernameInput.addEventListener('blur', (e) => {
                this.validateField('username', e.target.value);
                this.clearHint('username');
            });
            
            usernameInput.addEventListener('focus', () => {
                this.showHint('username', 'Введите уникальное имя пользователя');
            });
            
            // Динамическая валидация email
            emailInput.addEventListener('input', (e) => {
                this.validateField('email', e.target.value);
                this.showHint('email', 'Введите действующий email адрес');
            });
            
            emailInput.addEventListener('blur', (e) => {
                this.validateField('email', e.target.value);
                this.clearHint('email');
            });
            
            emailInput.addEventListener('focus', () => {
                this.showHint('email', 'Например: user@example.com');
            });
            
            // Динамическая валидация пароля
            passwordInput.addEventListener('input', (e) => {
                this.validateField('password', e.target.value);
                this.updatePasswordStrength(e.target.value);
            });
            
            passwordInput.addEventListener('blur', (e) => {
                this.validateField('password', e.target.value);
            });
            
            passwordInput.addEventListener('focus', () => {
                passwordHint.style.display = 'block';
            });
            
            // Динамическая валидация согласия
            agreeCheckbox.addEventListener('change', () => {
                this.validateField('agree', agreeCheckbox.checked);
            });
            
            // Обработка отправки формы (Требование 2)
            form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            // Обработка клавиши Enter
            form.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
                    e.preventDefault();
                    if (submitBtn && !submitBtn.disabled) {
                        submitBtn.click();
                    }
                }
            });
            
            console.log('Обработчики событий инициализированы');
        }
        
        /**
         * Инициализирует мониторинг производительности
         */
        initPerformanceMonitoring() {
            // Мониторинг времени валидации
            const originalValidateAll = this.validator.validateAll.bind(this.validator);
            this.validator.validateAll = function(data) {
                const startTime = performance.now();
                const result = originalValidateAll(data);
                const endTime = performance.now();
                
                console.log(`Валидация выполнена за ${(endTime - startTime).toFixed(2)}ms`);
                return result;
            };
        }
        
        /**
         * Валидирует поле формы
         * @param {string} field - Имя поля
         * @param {any} value - Значение поля
         * @returns {boolean} true если поле валидно
         */
        validateField(field, value) {
            let error = '';
            
            switch(field) {
                case 'username':
                    error = this.validator.validateUsername(value);
                    break;
                case 'email':
                    error = this.validator.validateEmail(value);
                    break;
                case 'password':
                    error = this.validator.validatePassword(value);
                    break;
                case 'agree':
                    error = this.validator.validateAgreement(value);
                    break;
            }
            
            this.displayError(field, error);
            this.updateSubmitButton();
            
            // Обновляем состояние приложения
            appState.isFormValid = this.isFormValid();
            appState.lastValidation = new Date().toISOString();
            
            console.log(`Валидация поля "${field}":`, error ? `Ошибка: ${error}` : 'Успешно');
            
            return !error;
        }
        
        /**
         * Отображает ошибку валидации
         * @param {string} field - Имя поля
         * @param {string} error - Сообщение об ошибке
         */
        displayError(field, error) {
            const errorElement = document.getElementById(`${field}Error`);
            const inputElement = document.getElementById(field);
            
            if (!errorElement || !inputElement) return;
            
            if (error) {
                errorElement.textContent = error;
                errorElement.style.display = 'block';
                errorElement.setAttribute('role', 'alert');
                inputElement.style.borderColor = '#dc2626';
                inputElement.setAttribute('aria-invalid', 'true');
                inputElement.setAttribute('aria-describedby', `${field}Error`);
            } else {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
                inputElement.style.borderColor = '#e0e7ff';
                inputElement.setAttribute('aria-invalid', 'false');
                inputElement.removeAttribute('aria-describedby');
            }
        }
        
        /**
         * Показывает подсказку для поля
         * @param {string} field - Имя поля
         * @param {string} message - Текст подсказки
         */
        showHint(field, message) {
            const hintElement = document.getElementById(`${field}Hint`);
            if (hintElement && !hintElement.textContent.includes('Пароль должен')) {
                hintElement.textContent = message;
                hintElement.style.display = 'block';
                hintElement.style.color = '#6b7280';
            }
        }
        
        /**
         * Скрывает подсказку
         * @param {string} field - Имя поля
         */
        clearHint(field) {
            const hintElement = document.getElementById(`${field}Hint`);
            if (hintElement && !hintElement.textContent.includes('Пароль должен')) {
                hintElement.textContent = '';
                hintElement.style.display = 'none';
            }
        }
        
        /**
         * Обновляет кнопку отправки
         */
        updateSubmitButton() {
            const isFormValid = this.isFormValid();
            submitBtn.disabled = !isFormValid || this.isSubmitting;
            submitBtn.textContent = this.isSubmitting ? 'Отправка...' : 'Войти';
            submitBtn.setAttribute('aria-disabled', submitBtn.disabled.toString());
        }
        
        /**
         * Проверяет, валидна ли вся форма
         * @returns {boolean} true если форма валидна
         */
        isFormValid() {
            return !Object.values(this.validator.errors).some(error => error);
        }
        
        /**
         * Обновляет индикатор сложности пароля
         * @param {string} password - Пароль
         */
        updatePasswordStrength(password) {
            if (!password) return;
            
            const strength = userRegister.checkPasswordStrength(password);
            const strengthElement = document.createElement('div');
            strengthElement.id = 'passwordStrength';
            strengthElement.style.cssText = `
                margin-top: 5px;
                font-size: 0.8rem;
                color: ${this.getStrengthColor(strength.score)};
            `;
            
            let existingStrength = document.getElementById('passwordStrength');
            if (existingStrength) {
                existingStrength.textContent = `Сложность: ${strength.strength} (${strength.score}/${strength.maxScore})`;
            } else {
                strengthElement.textContent = `Сложность: ${strength.strength} (${strength.score}/${strength.maxScore})`;
                passwordError.parentNode.appendChild(strengthElement);
            }
        }
        
        /**
         * Возвращает цвет для индикатора сложности
         * @param {number} score - Оценка сложности
         * @returns {string} Цвет
         */
        getStrengthColor(score) {
            if (score >= 5) return '#16a34a'; // зеленый
            if (score >= 4) return '#ca8a04'; // желтый
            if (score >= 3) return '#ea580c'; // оранжевый
            return '#dc2626'; // красный
        }
        
        /**
         * Обрабатывает отправку формы (Требование 2 - POST запрос)
         * @param {Event} e - Событие отправки
         */
        async handleSubmit(e) {
            e.preventDefault();
            console.log('Обработка отправки формы');
            
            const formData = {
                username: usernameInput.value,
                email: emailInput.value,
                password: passwordInput.value,
                agree: agreeCheckbox.checked
            };
            
            // Финальная валидация
            if (!this.validator.validateAll(formData)) {
                Object.keys(this.validator.errors).forEach(field => {
                    this.displayError(field, this.validator.errors[field]);
                });
                
                this.showFormStatus('Пожалуйста, исправьте ошибки в форме', 'error');
                
                if (window.notificationManager) {
                    window.notificationManager.error('Пожалуйста, исправьте ошибки в форме');
                }
                
                return;
            }
            
            this.isSubmitting = true;
            this.updateSubmitButton();
            this.showFormStatus('Отправка данных...', 'info');
            
            // Логируем начало отправки
            console.log('Начало отправки данных:', {
                username: formData.username,
                email: formData.email,
                timestamp: new Date().toISOString()
            });
            
            try {
                // 1. Регистрация пользователя (Требование 2 - POST запрос)
                const startTime = performance.now();
                const registerResult = await userRegister.register(
                    formData.username,
                    formData.email,
                    formData.password,
                    formData.agree
                );
                const registerTime = performance.now() - startTime;
                
                console.log('Регистрация выполнена:', {
                    result: registerResult,
                    time: `${registerTime.toFixed(2)}ms`
                });
                
                // 2. Авторизация пользователя
                const loginStartTime = performance.now();
                const loginResult = await userLogin.login(
                    formData.email,
                    formData.password
                );
                const loginTime = performance.now() - loginStartTime;
                
                console.log('Авторизация выполнена:', {
                    result: loginResult,
                    time: `${loginTime.toFixed(2)}ms`
                });
                
                // Обновляем счетчик API вызовов
                appState.apiCalls += 2;
                
                // Показываем успешное сообщение
                this.showFormStatus('Регистрация и вход выполнены успешно!', 'success');
                
                // Показываем уведомление
                if (window.notificationManager) {
                    window.notificationManager.success('Вы успешно зарегистрированы и авторизованы!');
                }
                
                // Сохраняем данные
                localStorage.setItem('lastRegistration', JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    timestamp: new Date().toISOString(),
                    performance: {
                        registerTime: registerTime,
                        loginTime: loginTime,
                        totalTime: registerTime + loginTime
                    }
                }));
                
                // Логируем успешную операцию
                console.log('Операция завершена успешно:', {
                    username: formData.username,
                    totalTime: (registerTime + loginTime).toFixed(2) + 'ms',
                    apiCalls: appState.apiCalls
                });
                
                // Очищаем форму
                this.resetForm();
                
                // Обновляем данные на других страницах
                this.triggerDataRefresh();
                
                // Показываем статистику
                this.showOperationStats({
                    registerTime,
                    loginTime,
                    validationStats: this.validator.getValidationStats(),
                    registerStats: userRegister.getRegistrationStats(),
                    loginStats: userLogin.getLoginStats()
                });
                
            } catch (error) {
                console.error('Ошибка отправки данных:', error);
                
                this.showFormStatus(`Ошибка: ${error.message}`, 'error');
                
                if (window.notificationManager) {
                    window.notificationManager.error(`Ошибка: ${error.message}`);
                }
                
                // Fallback: сохраняем данные локально
                localStorage.setItem('userDataFallback', JSON.stringify({
                    ...formData,
                    password: '***',
                    timestamp: new Date().toISOString(),
                    error: error.message
                }));
                
                // Отображаем детали ошибки
                this.displayErrorDetails(error);
                
            } finally {
                this.isSubmitting = false;
                this.updateSubmitButton();
            }
        }
        
        /**
         * Показывает статус формы
         * @param {string} message - Сообщение
         * @param {string} type - Тип (success, error, info)
         */
        showFormStatus(message, type) {
            if (!formStatus) return;
            
            formStatus.textContent = message;
            formStatus.className = `form-status ${type}`;
            formStatus.style.display = 'block';
            formStatus.setAttribute('role', 'alert');
            
            if (type === 'success') {
                formStatus.setAttribute('aria-live', 'polite');
                setTimeout(() => {
                    formStatus.style.display = 'none';
                }, 5000);
            } else if (type === 'error') {
                formStatus.setAttribute('aria-live', 'assertive');
            } else {
                formStatus.setAttribute('aria-live', 'polite');
            }
        }
        
        /**
         * Отображает детали ошибки
         * @param {Error} error - Объект ошибки
         */
        displayErrorDetails(error) {
            const errorDetails = document.createElement('div');
            errorDetails.id = 'errorDetails';
            errorDetails.style.cssText = `
                margin-top: 10px;
                padding: 10px;
                background-color: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 6px;
                font-size: 0.9rem;
                color: #991b1b;
            `;
            
            errorDetails.innerHTML = `
                <strong>Детали ошибки:</strong><br>
                <code>${error.toString()}</code><br>
                <small>${new Date().toLocaleString()}</small>
            `;
            
            // Удаляем старые детали ошибки
            const oldDetails = document.getElementById('errorDetails');
            if (oldDetails) oldDetails.remove();
            
            formStatus.parentNode.insertBefore(errorDetails, formStatus.nextSibling);
        }
        
        /**
         * Сбрасывает форму
         */
        resetForm() {
            form.reset();
            Object.keys(this.validator.errors).forEach(field => {
                this.displayError(field, '');
            });
            this.updateSubmitButton();
            
            // Удаляем индикатор сложности пароля
            const strengthElement = document.getElementById('passwordStrength');
            if (strengthElement) strengthElement.remove();
            
            console.log('Форма сброшена');
        }
        
        /**
         * Запускает обновление данных на других страницах
         */
        triggerDataRefresh() {
            // Отправляем сообщение другим вкладкам
            localStorage.setItem('dataRefresh', Date.now().toString());
            
            // Отправляем событие
            window.dispatchEvent(new CustomEvent('dataShouldRefresh', {
                detail: {
                    timestamp: new Date().toISOString(),
                    source: 'loginForm'
                }
            }));
            
            console.log('Запрос на обновление данных отправлен');
        }
        
        /**
         * Показывает статистику операции
         * @param {Object} stats - Статистика
         */
        showOperationStats(stats) {
            console.log('Статистика операции:', stats);
            
            // Можно добавить отображение статистики на странице
            if (window.notificationManager) {
                window.notificationManager.info(
                    `Операция выполнена за ${(stats.registerTime + stats.loginTime).toFixed(2)}ms`,
                    3000
                );
            }
        }
    }
    
    // === Класс тестера API (Требования 3-4) ===
    
    class ApiTester {
        constructor() {
            this.isTesting = false;
            this.testHistory = [];
            this.intervalId = null;
            this.initEventListeners();
        }
        
        /**
         * Инициализирует обработчики событий
         */
        initEventListeners() {
            console.log('Инициализация обработчиков API тестов');
            
            if (testEducationBtn) {
                testEducationBtn.addEventListener('click', () => this.testEducationApi());
            }
            
            if (testAddCourseBtn) {
                testAddCourseBtn.addEventListener('click', () => this.testAddCourseApi());
            }
            
            if (testSkillsBtn) {
                testSkillsBtn.addEventListener('click', () => this.testSkillsApi());
            }
            
            console.log('Обработчики API тестов инициализированы');
        }
        
        /**
         * Тестирует API образования (Требование 3 - асинхронный запрос)
         */
        async testEducationApi() {
            if (this.isTesting) {
                this.showApiStatus('Тест уже выполняется...', 'warning');
                return;
            }
            
            this.isTesting = true;
            this.showApiStatus('Запрос данных образования...', 'info');
            this.disableButtons(true);
            
            const testId = `test_${Date.now()}`;
            const startTime = performance.now();
            
            try {
                console.log(`Запрос данных образования (ID: ${testId})...`);
                
                const response = await fetch(`${API_BASE_URL}/education`);
                appState.apiCalls++;
                
                const requestTime = performance.now() - startTime;
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                const data = result.data || result;
                
                const totalTime = performance.now() - startTime;
                
                this.showApiStatus(
                    `Данные получены! Курсов: ${Array.isArray(data) ? data.length : 1}. Время: ${totalTime.toFixed(2)}ms`,
                    'success'
                );
                
                this.displayApiData(data);
                console.log('Данные образования:', data);
                
                // Сохраняем данные для других страниц
                if (Array.isArray(data)) {
                    localStorage.setItem('educationData', JSON.stringify(data));
                }
                
                // Логируем тест
                this.logTest({
                    id: testId,
                    endpoint: '/education',
                    method: 'GET',
                    success: true,
                    requestTime: requestTime,
                    totalTime: totalTime,
                    dataSize: JSON.stringify(data).length,
                    timestamp: new Date().toISOString()
                });
                
                if (window.notificationManager) {
                    window.notificationManager.success('Данные образования успешно загружены');
                }
                
            } catch (error) {
                const totalTime = performance.now() - startTime;
                
                this.showApiStatus(`Ошибка: ${error.message}`, 'error');
                console.error('Ошибка тестирования API:', error);
                
                // Логируем ошибку
                this.logTest({
                    id: testId,
                    endpoint: '/education',
                    method: 'GET',
                    success: false,
                    error: error.message,
                    totalTime: totalTime,
                    timestamp: new Date().toISOString()
                });
                
                if (window.notificationManager) {
                    window.notificationManager.error(`Ошибка загрузки данных: ${error.message}`);
                }
            } finally {
                this.isTesting = false;
                this.disableButtons(false);
            }
        }
        
        /**
         * Тестирует добавление курса (Требование 2 - POST запрос)
         */
        async testAddCourseApi() {
            if (this.isTesting) {
                this.showApiStatus('Тест уже выполняется...', 'warning');
                return;
            }
            
            this.isTesting = true;
            this.showApiStatus('Добавление тестового курса...', 'info');
            this.disableButtons(true);
            
            const testId = `test_${Date.now()}`;
            const startTime = performance.now();
            
            try {
                const newCourse = {
                    year: new Date().getFullYear().toString(),
                    course: `Тестовый курс ${Math.floor(Math.random() * 1000)}`,
                    profile: "Добавлено через форму авторизации"
                };
                
                console.log(`Добавление курса (ID: ${testId}):`, newCourse);
                
                const response = await fetch(`${API_BASE_URL}/education`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newCourse)
                });
                appState.apiCalls++;
                
                const requestTime = performance.now() - startTime;
                
                const result = await response.json();
                const totalTime = performance.now() - startTime;
                
                this.showApiStatus(
                    result.message || 'Курс добавлен успешно',
                    'success'
                );
                
                this.displayApiData(result);
                console.log('Результат добавления курса:', result);
                
                // Логируем тест
                this.logTest({
                    id: testId,
                    endpoint: '/education',
                    method: 'POST',
                    success: true,
                    requestTime: requestTime,
                    totalTime: totalTime,
                    data: newCourse,
                    response: result,
                    timestamp: new Date().toISOString()
                });
                
                if (window.notificationManager) {
                    window.notificationManager.success('Курс успешно добавлен');
                }
                
                // Обновляем данные через 1 секунду
                setTimeout(() => this.testEducationApi(), 1000);
                
            } catch (error) {
                const totalTime = performance.now() - startTime;
                
                this.showApiStatus(`Ошибка: ${error.message}`, 'error');
                console.error('Ошибка добавления курса:', error);
                
                this.logTest({
                    id: testId,
                    endpoint: '/education',
                    method: 'POST',
                    success: false,
                    error: error.message,
                    totalTime: totalTime,
                    timestamp: new Date().toISOString()
                });
                
                if (window.notificationManager) {
                    window.notificationManager.error(`Ошибка добавления курса: ${error.message}`);
                }
            } finally {
                this.isTesting = false;
                this.disableButtons(false);
            }
        }
        
        /**
         * Тестирует API навыков
         */
        async testSkillsApi() {
            if (this.isTesting) {
                this.showApiStatus('Тест уже выполняется...', 'warning');
                return;
            }
            
            this.isTesting = true;
            this.showApiStatus('Запрос данных навыков...', 'info');
            this.disableButtons(true);
            
            const testId = `test_${Date.now()}`;
            const startTime = performance.now();
            
            try {
                console.log(`Запрос данных навыков (ID: ${testId})...`);
                
                const response = await fetch(`${API_BASE_URL}/skills`);
                appState.apiCalls++;
                
                const requestTime = performance.now() - startTime;
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                const data = result.data || result;
                
                const totalTime = performance.now() - startTime;
                
                this.showApiStatus(
                    `Навыки получены! Категорий: ${Array.isArray(data) ? data.length : 1}. Время: ${totalTime.toFixed(2)}ms`,
                    'success'
                );
                
                this.displayApiData(data);
                console.log('Данные навыков:', data);
                
                // Логируем тест
                this.logTest({
                    id: testId,
                    endpoint: '/skills',
                    method: 'GET',
                    success: true,
                    requestTime: requestTime,
                    totalTime: totalTime,
                    dataSize: JSON.stringify(data).length,
                    timestamp: new Date().toISOString()
                });
                
                if (window.notificationManager) {
                    window.notificationManager.success('Данные навыков успешно загружены');
                }
                
            } catch (error) {
                const totalTime = performance.now() - startTime;
                
                this.showApiStatus(`Ошибка: ${error.message}`, 'error');
                console.error('Ошибка тестирования API навыков:', error);
                
                this.logTest({
                    id: testId,
                    endpoint: '/skills',
                    method: 'GET',
                    success: false,
                    error: error.message,
                    totalTime: totalTime,
                    timestamp: new Date().toISOString()
                });
                
                if (window.notificationManager) {
                    window.notificationManager.error(`Ошибка загрузки навыков: ${error.message}`);
                }
            } finally {
                this.isTesting = false;
                this.disableButtons(false);
            }
        }
        
        /**
         * Запускает периодическое тестирование (Требование 4)
         */
        startPeriodicTesting() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
            
            // Тестируем каждые 5 минут (300000 мс)
            this.intervalId = setInterval(() => {
                console.log('Периодическое тестирование API...');
                this.testEducationApi();
            }, 300000);
            
            console.log('Периодическое тестирование API запущено (каждые 5 минут)');
        }
        
        /**
         * Останавливает периодическое тестирование
         */
        stopPeriodicTesting() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
                console.log('Периодическое тестирование остановлено');
            }
        }
        
        /**
         * Показывает статус API
         * @param {string} message - Сообщение
         * @param {string} type - Тип
         */
        showApiStatus(message, type) {
            if (!apiStatus) return;
            
            apiStatus.textContent = message;
            apiStatus.className = `data-status ${type}`;
            apiStatus.style.display = 'block';
            
            if (type === 'success') {
                setTimeout(() => {
                    apiStatus.style.display = 'none';
                }, 3000);
            }
        }
        
        /**
         * Отображает данные API
         * @param {any} data - Данные
         */
        displayApiData(data) {
            if (!apiDataPreview || !apiDataContainer) return;
            
            apiDataPreview.textContent = JSON.stringify(data, null, 2);
            apiDataContainer.style.display = 'block';
            
            // Прокручиваем к данным
            apiDataContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        /**
         * Отключает/включает кнопки
         * @param {boolean} disabled - true для отключения
         */
        disableButtons(disabled) {
            [testEducationBtn, testAddCourseBtn, testSkillsBtn].forEach(btn => {
                if (btn) {
                    btn.disabled = disabled;
                    btn.textContent = disabled ? '...' : btn.textContent.replace('...', '').trim();
                }
            });
        }
        
        /**
         * Логирует тест
         * @param {Object} testData - Данные теста
         */
        logTest(testData) {
            this.testHistory.push(testData);
            
            // Ограничиваем историю 50 записями
            if (this.testHistory.length > 50) {
                this.testHistory.shift();
            }
            
            // Сохраняем в localStorage
            localStorage.setItem('apiTestHistory', JSON.stringify(this.testHistory));
            
            console.log(`Тест записан: ${testData.id}`, testData.success ? 'Успешно' : 'Ошибка');
        }
        
        /**
         * Получает статистику тестов
         * @returns {Object} Статистика
         */
        getTestStats() {
            const total = this.testHistory.length;
            const successful = this.testHistory.filter(t => t.success).length;
            const failed = this.testHistory.filter(t => !t.success).length;
            
            // Среднее время выполнения
            const avgTime = this.testHistory.length > 0
                ? this.testHistory.reduce((sum, t) => sum + (t.totalTime || 0), 0) / this.testHistory.length
                : 0;
            
            return {
                totalTests: total,
                successful: successful,
                failed: failed,
                successRate: total > 0 ? (successful / total * 100).toFixed(2) : 0,
                avgTime: avgTime.toFixed(2),
                lastTest: this.testHistory[this.testHistory.length - 1] || null
            };
        }
    }
    
    // === Инициализация приложения ===
    
    console.log('Инициализация приложения...');
    
    // Инициализация менеджера формы
    const formManager = new FormManager();
    
    // Инициализация тестера API
    const apiTester = new ApiTester();
    
    // Запускаем периодическое тестирование
    apiTester.startPeriodicTesting();
    
    // Автоматическое тестирование API при загрузке
    setTimeout(() => {
        console.log('Автоматический тест API...');
        apiTester.testEducationApi();
    }, 1000);
    
    // Восстанавливаем состояние из localStorage
    try {
        const savedState = localStorage.getItem('loginFormState');
        if (savedState) {
            const state = JSON.parse(savedState);
            if (state.username) usernameInput.value = state.username;
            if (state.email) emailInput.value = state.email;
            console.log('Состояние формы восстановлено');
        }
    } catch (error) {
        console.error('Ошибка восстановления состояния:', error);
    }
    
    // Сохраняем состояние при изменении
    [usernameInput, emailInput].forEach(input => {
        input.addEventListener('input', () => {
            const state = {
                username: usernameInput.value,
                email: emailInput.value,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('loginFormState', JSON.stringify(state));
        });
    });
    
    // Экспортируем для отладки
    window.appState = appState;
    window.formManager = formManager;
    window.apiTester = apiTester;
    window.userLogin = userLogin;
    window.userRegister = userRegister;
    
    console.log('Приложение инициализировано:', {
        formManager: !!formManager,
        apiTester: !!apiTester,
        userLogin: !!userLogin,
        userRegister: !!userRegister,
        notificationManager: !!window.notificationManager
    });
    
    // Показываем информацию о состоянии
    if (window.notificationManager) {
        window.notificationManager.info('Страница авторизации готова к работе', 2000);
    }
});