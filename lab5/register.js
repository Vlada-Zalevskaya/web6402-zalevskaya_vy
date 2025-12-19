// register.js - логика страницы регистрации
// Альтернативная/дополнительная реализация регистрации

console.log('Скрипт регистрации загружен');

// Проверяем, находимся ли мы на странице регистрации
if (document.querySelector('#registerForm') || document.title.includes('Регистрация')) {
    initRegistrationPage();
} else {
    console.log('Страница регистрации не обнаружена, скрипт не активирован');
}

/**
 * Инициализирует страницу регистрации
 */
function initRegistrationPage() {
    console.log('Инициализация страницы регистрации');
    
    // Инициализация классов
    const userRegister = new UserRegister();
    
    // Конфигурация
    const API_BASE_URL = 'http://localhost:3000';
    
    // Состояние формы
    let formState = {
        isValid: false,
        isSubmitting: false,
        validationErrors: {},
        fieldHistory: {}
    };
    
    // === DOM элементы ===
    
    const registerForm = document.getElementById('registerForm') || createRegisterForm();
    const usernameInput = document.getElementById('regUsername') || document.getElementById('username');
    const emailInput = document.getElementById('regEmail') || document.getElementById('email');
    const passwordInput = document.getElementById('regPassword') || document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword') || createConfirmPasswordField();
    const agreeCheckbox = document.getElementById('regAgree') || document.getElementById('agree');
    const submitBtn = document.getElementById('registerSubmit') || document.querySelector('button[type="submit"]');
    
    // Если на странице нет формы регистрации, создаем её
    if (!registerForm) {
        console.log('Форма регистрации не найдена, создаем новую');
        createRegistrationPage();
        return;
    }
    
    // === Валидация формы ===
    
    /**
     * Класс валидатора регистрации
     */
    class RegistrationValidator {
        constructor() {
            this.errors = {};
            this.warnings = {};
            this.validationRules = this.getValidationRules();
        }
        
        /**
         * Возвращает правила валидации
         */
        getValidationRules() {
            return {
                username: {
                    required: true,
                    minLength: 3,
                    maxLength: 20,
                    pattern: /^[a-zA-Z0-9_]+$/,
                    custom: (value) => {
                        const forbidden = ['admin', 'root', 'superuser', 'system'];
                        if (forbidden.includes(value.toLowerCase())) {
                            return 'Это имя пользователя запрещено';
                        }
                        return '';
                    }
                },
                email: {
                    required: true,
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    custom: (value) => {
                        const domain = value.split('@')[1];
                        const disposableDomains = ['tempmail.com', 'throwaway.com'];
                        if (disposableDomains.includes(domain.toLowerCase())) {
                            return 'Пожалуйста, используйте постоянный email';
                        }
                        return '';
                    }
                },
                password: {
                    required: true,
                    minLength: 8,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: false,
                    custom: (value) => {
                        const weakPasswords = [
                            'password', '123456', 'qwerty', 'admin', 
                            'welcome', 'password123', '123456789'
                        ];
                        if (weakPasswords.includes(value.toLowerCase())) {
                            return 'Пароль слишком простой';
                        }
                        return '';
                    }
                },
                confirmPassword: {
                    required: true,
                    match: 'password'
                },
                agree: {
                    required: true
                }
            };
        }
        
        /**
         * Валидирует поле
         * @param {string} field - Имя поля
         * @param {any} value - Значение
         * @param {Object} formData - Данные всей формы
         * @returns {Object} Результат валидации
         */
        validateField(field, value, formData = {}) {
            const rules = this.validationRules[field];
            if (!rules) return { isValid: true, errors: [], warnings: [] };
            
            const errors = [];
            const warnings = [];
            let isValid = true;
            
            // Проверка на обязательность
            if (rules.required && (!value || value.trim() === '')) {
                errors.push('Это поле обязательно для заполнения');
                isValid = false;
                return { isValid, errors, warnings };
            }
            
            // Проверка минимальной длины
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`Минимальная длина: ${rules.minLength} символов`);
                isValid = false;
            }
            
            // Проверка максимальной длины
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(`Максимальная длина: ${rules.maxLength} символов`);
                isValid = false;
            }
            
            // Проверка паттерна
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push('Некорректный формат');
                isValid = false;
            }
            
            // Проверка совпадения паролей
            if (field === 'confirmPassword' && rules.match) {
                const matchField = rules.match;
                if (value !== formData[matchField]) {
                    errors.push('Пароли не совпадают');
                    isValid = false;
                }
            }
            
            // Проверка заглавных букв в пароле
            if (field === 'password' && rules.requireUppercase && !/[A-Z]/.test(value)) {
                errors.push('Добавьте хотя бы одну заглавную букву');
                isValid = false;
            }
            
            // Проверка строчных букв в пароле
            if (field === 'password' && rules.requireLowercase && !/[a-z]/.test(value)) {
                errors.push('Добавьте хотя бы одну строчную букву');
                isValid = false;
            }
            
            // Проверка цифр в пароле
            if (field === 'password' && rules.requireNumbers && !/\d/.test(value)) {
                errors.push('Добавьте хотя бы одну цифру');
                isValid = false;
            }
            
            // Проверка специальных символов в пароле
            if (field === 'password' && rules.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
                errors.push('Добавьте хотя бы один специальный символ');
                isValid = false;
            }
            
            // Кастомная валидация
            if (rules.custom) {
                const customError = rules.custom(value, formData);
                if (customError) {
                    errors.push(customError);
                    isValid = false;
                }
            }
            
            // Предупреждения
            if (field === 'password' && value.length >= 8 && value.length < 12) {
                warnings.push('Рекомендуемая длина пароля: 12+ символов');
            }
            
            return { isValid, errors, warnings };
        }
        
        /**
         * Валидирует всю форму
         * @param {Object} formData - Данные формы
         * @returns {Object} Результат валидации
         */
        validateAll(formData) {
            this.errors = {};
            this.warnings = {};
            let isValid = true;
            
            Object.keys(this.validationRules).forEach(field => {
                const value = formData[field];
                const result = this.validateField(field, value, formData);
                
                this.errors[field] = result.errors;
                this.warnings[field] = result.warnings;
                
                if (!result.isValid) {
                    isValid = false;
                }
            });
            
            return {
                isValid,
                errors: this.errors,
                warnings: this.warnings,
                errorCount: Object.values(this.errors).flat().length,
                warningCount: Object.values(this.warnings).flat().length
            };
        }
        
        /**
         * Проверяет сложность пароля
         * @param {string} password - Пароль
         * @returns {Object} Результат проверки
         */
        checkPasswordStrength(password) {
            let score = 0;
            const feedback = [];
            
            // Длина
            if (password.length >= 8) score += 1;
            if (password.length >= 12) score += 1;
            if (password.length >= 16) score += 1;
            
            // Разнообразие символов
            if (/[a-z]/.test(password)) score += 1;
            if (/[A-Z]/.test(password)) score += 1;
            if (/\d/.test(password)) score += 1;
            if (/[^A-Za-z0-9]/.test(password)) score += 2;
            
            // Проверка на повторяющиеся символы
            if (/(.)\1{2,}/.test(password)) {
                score -= 1;
                feedback.push('Избегайте повторяющихся символов');
            }
            
            // Проверка на последовательности
            const sequences = ['abc', '123', 'qwe', 'asd', 'zxc'];
            const lowerPassword = password.toLowerCase();
            if (sequences.some(seq => lowerPassword.includes(seq))) {
                score -= 1;
                feedback.push('Избегайте простых последовательностей');
            }
            
            // Определение уровня сложности
            let strength = 'очень слабый';
            let strengthClass = 'very-weak';
            
            if (score >= 8) {
                strength = 'очень сильный';
                strengthClass = 'very-strong';
            } else if (score >= 6) {
                strength = 'сильный';
                strengthClass = 'strong';
            } else if (score >= 4) {
                strength = 'средний';
                strengthClass = 'medium';
            } else if (score >= 2) {
                strength = 'слабый';
                strengthClass = 'weak';
            }
            
            return {
                score,
                maxScore: 10,
                strength,
                strengthClass,
                feedback: feedback.length > 0 ? feedback : ['Пароль хороший'],
                isAcceptable: score >= 4,
                suggestions: this.getPasswordSuggestions(password)
            };
        }
        
        /**
         * Возвращает предложения по улучшению пароля
         * @param {string} password - Пароль
         * @returns {Array} Предложения
         */
        getPasswordSuggestions(password) {
            const suggestions = [];
            
            if (password.length < 12) {
                suggestions.push('Увеличьте длину до 12+ символов');
            }
            
            if (!/[A-Z]/.test(password)) {
                suggestions.push('Добавьте заглавные буквы');
            }
            
            if (!/\d/.test(password)) {
                suggestions.push('Добавьте цифры');
            }
            
            if (!/[^A-Za-z0-9]/.test(password)) {
                suggestions.push('Добавьте специальные символы (!@#$% и т.д.)');
            }
            
            return suggestions;
        }
    }
    
    // === Управление формой ===
    
    /**
     * Класс менеджера формы регистрации
     */
    class RegistrationFormManager {
        constructor() {
            this.validator = new RegistrationValidator();
            this.isSubmitting = false;
            this.fieldHistory = {};
            this.initEventListeners();
            this.setupPasswordVisibilityToggle();
            this.setupPasswordGenerator();
        }
        
        /**
         * Инициализирует обработчики событий
         */
        initEventListeners() {
            console.log('Инициализация обработчиков формы регистрации');
            
            // Список полей для отслеживания
            const fields = [
                { element: usernameInput, name: 'username' },
                { element: emailInput, name: 'email' },
                { element: passwordInput, name: 'password' },
                { element: confirmPasswordInput, name: 'confirmPassword' }
            ];
            
            // Динамическая валидация для каждого поля
            fields.forEach(({ element, name }) => {
                if (!element) return;
                
                // Валидация при вводе
                element.addEventListener('input', (e) => {
                    this.validateAndUpdateField(name, e.target.value);
                    this.updateFieldHistory(name, e.target.value);
                });
                
                // Валидация при потере фокуса
                element.addEventListener('blur', (e) => {
                    this.validateAndUpdateField(name, e.target.value);
                });
                
                // Подсказки при получении фокуса
                element.addEventListener('focus', () => {
                    this.showFieldHint(name);
                });
            });
            
            // Валидация согласия
            if (agreeCheckbox) {
                agreeCheckbox.addEventListener('change', () => {
                    this.validateAndUpdateField('agree', agreeCheckbox.checked);
                });
            }
            
            // Обработка отправки формы
            registerForm.addEventListener('submit', (e) => this.handleSubmit(e));
            
            // Обработка клавиши Enter
            registerForm.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    this.generateAndFillPassword();
                }
            });
            
            // Восстановление данных формы при загрузке
            this.restoreFormData();
            
            console.log('Обработчики формы регистрации инициализированы');
        }
        
        /**
         * Настраивает переключение видимости пароля
         */
        setupPasswordVisibilityToggle() {
            const toggleButtons = [
                { input: passwordInput, buttonId: 'togglePassword' },
                { input: confirmPasswordInput, buttonId: 'toggleConfirmPassword' }
            ];
            
            toggleButtons.forEach(({ input, buttonId }) => {
                if (!input) return;
                
                // Создаем кнопку переключения
                const toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.id = buttonId;
                toggleBtn.innerHTML = '👁️';
                toggleBtn.title = 'Показать/скрыть пароль';
                toggleBtn.style.cssText = `
                    position: absolute;
                    right: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1.2rem;
                    padding: 5px;
                `;
                
                // Обертываем поле в контейнер
                const wrapper = document.createElement('div');
                wrapper.style.position = 'relative';
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);
                wrapper.appendChild(toggleBtn);
                
                // Обработчик клика
                toggleBtn.addEventListener('click', () => {
                    const type = input.type === 'password' ? 'text' : 'password';
                    input.type = type;
                    toggleBtn.innerHTML = type === 'password' ? '👁️' : '👁️‍🗨️';
                });
            });
        }
        
        /**
         * Настраивает генератор паролей
         */
        setupPasswordGenerator() {
            const generateBtn = document.createElement('button');
            generateBtn.type = 'button';
            generateBtn.id = 'generatePassword';
            generateBtn.textContent = '🎲 Сгенерировать пароль';
            generateBtn.className = 'password-generator-btn';
            generateBtn.style.cssText = `
                margin-top: 10px;
                padding: 8px 16px;
                background-color: #4f46e5;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9rem;
            `;
            
            // Добавляем кнопку после поля пароля
            if (passwordInput && passwordInput.parentNode) {
                passwordInput.parentNode.appendChild(generateBtn);
            }
            
            // Обработчик генерации пароля
            generateBtn.addEventListener('click', () => {
                this.generateAndFillPassword();
            });
        }
        
        /**
         * Генерирует и заполняет пароль
         */
        generateAndFillPassword() {
            const password = this.generateStrongPassword();
            
            if (passwordInput) {
                passwordInput.value = password;
                this.validateAndUpdateField('password', password);
            }
            
            if (confirmPasswordInput) {
                confirmPasswordInput.value = password;
                this.validateAndUpdateField('confirmPassword', password);
            }
            
            // Показываем уведомление
            if (window.notificationManager) {
                window.notificationManager.info('Пароль сгенерирован и заполнен', 2000);
            }
            
            console.log('Пароль сгенерирован:', password);
        }
        
        /**
         * Генерирует надежный пароль
         * @returns {string} Пароль
         */
        generateStrongPassword() {
            const lowercase = 'abcdefghijklmnopqrstuvwxyz';
            const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const numbers = '0123456789';
            const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            
            const allChars = lowercase + uppercase + numbers + symbols;
            let password = '';
            
            // Гарантируем наличие разных типов символов
            password += lowercase[Math.floor(Math.random() * lowercase.length)];
            password += uppercase[Math.floor(Math.random() * uppercase.length)];
            password += numbers[Math.floor(Math.random() * numbers.length)];
            password += symbols[Math.floor(Math.random() * symbols.length)];
            
            // Дополняем до 12 символов
            for (let i = 4; i < 12; i++) {
                password += allChars[Math.floor(Math.random() * allChars.length)];
            }
            
            // Перемешиваем символы
            password = password.split('').sort(() => Math.random() - 0.5).join('');
            
            return password;
        }
        
        /**
         * Валидирует и обновляет поле
         * @param {string} fieldName - Имя поля
         * @param {any} value - Значение
         */
        validateAndUpdateField(fieldName, value) {
            const formData = this.getFormData();
            const result = this.validator.validateField(fieldName, value, formData);
            
            // Обновляем состояние
            formState.validationErrors[fieldName] = result.errors;
            formState.isValid = this.isFormValid();
            
            // Отображаем ошибки
            this.displayFieldValidation(fieldName, result);
            
            // Для пароля показываем сложность
            if (fieldName === 'password') {
                this.displayPasswordStrength(value);
            }
            
            // Обновляем кнопку отправки
            this.updateSubmitButton();
        }
        
        /**
         * Отображает валидацию поля
         * @param {string} fieldName - Имя поля
         * @param {Object} validationResult - Результат валидации
         */
        displayFieldValidation(fieldName, validationResult) {
            const fieldElement = this.getFieldElement(fieldName);
            if (!fieldElement) return;
            
            // Удаляем старые сообщения
            this.removeFieldMessages(fieldName);
            
            // Добавляем сообщения об ошибках
            if (validationResult.errors.length > 0) {
                validationResult.errors.forEach(error => {
                    this.addErrorMessage(fieldName, error);
                });
                this.markFieldInvalid(fieldName);
            } else {
                this.markFieldValid(fieldName);
            }
            
            // Добавляем предупреждения
            if (validationResult.warnings.length > 0) {
                validationResult.warnings.forEach(warning => {
                    this.addWarningMessage(fieldName, warning);
                });
            }
        }
        
        /**
         * Отображает сложность пароля
         * @param {string} password - Пароль
         */
        displayPasswordStrength(password) {
            const strength = this.validator.checkPasswordStrength(password);
            
            // Удаляем старый индикатор
            const oldIndicator = document.getElementById('passwordStrengthIndicator');
            if (oldIndicator) oldIndicator.remove();
            
            // Создаем новый индикатор
            const indicator = document.createElement('div');
            indicator.id = 'passwordStrengthIndicator';
            indicator.style.cssText = `
                margin-top: 10px;
                padding: 10px;
                border-radius: 6px;
                background-color: ${this.getStrengthColor(strength.score)};
                color: white;
                font-size: 0.9rem;
            `;
            
            indicator.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Сложность: ${strength.strength}</span>
                    <span>${strength.score}/${strength.maxScore}</span>
                </div>
                <div style="height: 4px; background: rgba(255,255,255,0.3); margin: 8px 0; border-radius: 2px;">
                    <div style="width: ${(strength.score / strength.maxScore) * 100}%; height: 100%; background: white; border-radius: 2px;"></div>
                </div>
                ${strength.feedback.map(msg => `<div style="font-size: 0.8rem; margin-top: 4px;">• ${msg}</div>`).join('')}
            `;
            
            // Добавляем после поля пароля
            if (passwordInput && passwordInput.parentNode) {
                passwordInput.parentNode.appendChild(indicator);
            }
        }
        
        /**
         * Возвращает цвет для индикатора сложности
         * @param {number} score - Оценка сложности
         * @returns {string} Цвет
         */
        getStrengthColor(score) {
            if (score >= 8) return '#10b981'; // зеленый
            if (score >= 6) return '#3b82f6'; // синий
            if (score >= 4) return '#f59e0b'; // желтый
            if (score >= 2) return '#ef4444'; // красный
            return '#6b7280'; // серый
        }
        
        /**
         * Добавляет сообщение об ошибке
         * @param {string} fieldName - Имя поля
         * @param {string} message - Сообщение
         */
        addErrorMessage(fieldName, message) {
            const fieldElement = this.getFieldElement(fieldName);
            if (!fieldElement) return;
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = message;
            errorDiv.style.cssText = `
                color: #dc2626;
                font-size: 0.875rem;
                margin-top: 4px;
            `;
            
            fieldElement.parentNode.appendChild(errorDiv);
        }
        
        /**
         * Добавляет предупреждение
         * @param {string} fieldName - Имя поля
         * @param {string} message - Сообщение
         */
        addWarningMessage(fieldName, message) {
            const fieldElement = this.getFieldElement(fieldName);
            if (!fieldElement) return;
            
            const warningDiv = document.createElement('div');
            warningDiv.className = 'field-warning';
            warningDiv.textContent = message;
            warningDiv.style.cssText = `
                color: #d97706;
                font-size: 0.875rem;
                margin-top: 4px;
            `;
            
            fieldElement.parentNode.appendChild(warningDiv);
        }
        
        /**
         * Удаляет сообщения поля
         * @param {string} fieldName - Имя поля
         */
        removeFieldMessages(fieldName) {
            const fieldElement = this.getFieldElement(fieldName);
            if (!fieldElement || !fieldElement.parentNode) return;
            
            const messages = fieldElement.parentNode.querySelectorAll('.field-error, .field-warning');
            messages.forEach(msg => msg.remove());
        }
        
        /**
         * Помечает поле как невалидное
         * @param {string} fieldName - Имя поля
         */
        markFieldInvalid(fieldName) {
            const fieldElement = this.getFieldElement(fieldName);
            if (fieldElement) {
                fieldElement.style.borderColor = '#dc2626';
                fieldElement.setAttribute('aria-invalid', 'true');
            }
        }
        
        /**
         * Помечает поле как валидное
         * @param {string} fieldName - Имя поля
         */
        markFieldValid(fieldName) {
            const fieldElement = this.getFieldElement(fieldName);
            if (fieldElement) {
                fieldElement.style.borderColor = '#10b981';
                fieldElement.setAttribute('aria-invalid', 'false');
            }
        }
        
        /**
         * Показывает подсказку для поля
         * @param {string} fieldName - Имя поля
         */
        showFieldHint(fieldName) {
            const hints = {
                username: 'Используйте латинские буквы, цифры и подчеркивание (3-20 символов)',
                email: 'Введите действующий email адрес',
                password: 'Минимум 8 символов, включая буквы и цифры',
                confirmPassword: 'Повторите пароль для подтверждения'
            };
            
            if (hints[fieldName] && window.notificationManager) {
                window.notificationManager.info(hints[fieldName], 3000);
            }
        }
        
        /**
         * Возвращает элемент поля
         * @param {string} fieldName - Имя поля
         * @returns {HTMLElement|null} Элемент поля
         */
        getFieldElement(fieldName) {
            const elements = {
                username: usernameInput,
                email: emailInput,
                password: passwordInput,
                confirmPassword: confirmPasswordInput,
                agree: agreeCheckbox
            };
            
            return elements[fieldName] || null;
        }
        
        /**
         * Обновляет кнопку отправки
         */
        updateSubmitButton() {
            if (!submitBtn) return;
            
            const isValid = this.isFormValid();
            submitBtn.disabled = !isValid || this.isSubmitting;
            submitBtn.textContent = this.isSubmitting ? 'Регистрация...' : 'Зарегистрироваться';
            submitBtn.setAttribute('aria-disabled', submitBtn.disabled.toString());
        }
        
        /**
         * Проверяет, валидна ли форма
         * @returns {boolean} true если форма валидна
         */
        isFormValid() {
            return Object.values(formState.validationErrors).every(errors => errors.length === 0);
        }
        
        /**
         * Получает данные формы
         * @returns {Object} Данные формы
         */
        getFormData() {
            return {
                username: usernameInput ? usernameInput.value : '',
                email: emailInput ? emailInput.value : '',
                password: passwordInput ? passwordInput.value : '',
                confirmPassword: confirmPasswordInput ? confirmPasswordInput.value : '',
                agree: agreeCheckbox ? agreeCheckbox.checked : false
            };
        }
        
        /**
         * Обновляет историю поля
         * @param {string} fieldName - Имя поля
         * @param {any} value - Значение
         */
        updateFieldHistory(fieldName, value) {
            if (!this.fieldHistory[fieldName]) {
                this.fieldHistory[fieldName] = [];
            }
            
            this.fieldHistory[fieldName].push({
                value: fieldName.includes('password') ? '***' : value,
                timestamp: new Date().toISOString()
            });
            
            // Ограничиваем историю 20 записями
            if (this.fieldHistory[fieldName].length > 20) {
                this.fieldHistory[fieldName].shift();
            }
        }
        
        /**
         * Восстанавливает данные формы
         */
        restoreFormData() {
            try {
                const savedData = localStorage.getItem('registration_form_data');
                if (savedData) {
                    const data = JSON.parse(savedData);
                    
                    if (usernameInput && data.username) usernameInput.value = data.username;
                    if (emailInput && data.email) emailInput.value = data.email;
                    
                    console.log('Данные формы восстановлены');
                }
            } catch (error) {
                console.error('Ошибка восстановления данных формы:', error);
            }
        }
        
        /**
         * Сохраняет данные формы
         */
        saveFormData() {
            try {
                const data = {
                    username: usernameInput ? usernameInput.value : '',
                    email: emailInput ? emailInput.value : '',
                    savedAt: new Date().toISOString()
                };
                
                localStorage.setItem('registration_form_data', JSON.stringify(data));
            } catch (error) {
                console.error('Ошибка сохранения данных формы:', error);
            }
        }
        
        /**
         * Обрабатывает отправку формы
         * @param {Event} e - Событие отправки
         */
        async handleSubmit(e) {
            e.preventDefault();
            console.log('Обработка регистрации');
            
            const formData = this.getFormData();
            
            // Финальная валидация
            const validationResult = this.validator.validateAll(formData);
            
            if (!validationResult.isValid) {
                // Показываем все ошибки
                Object.entries(validationResult.errors).forEach(([field, errors]) => {
                    if (errors.length > 0) {
                        this.displayFieldValidation(field, { errors, warnings: [] });
                    }
                });
                
                if (window.notificationManager) {
                    window.notificationManager.error('Пожалуйста, исправьте ошибки в форме');
                }
                
                return;
            }
            
            this.isSubmitting = true;
            this.updateSubmitButton();
            
            // Показываем статус
            this.showFormStatus('Регистрация...', 'info');
            
            try {
                // Регистрация пользователя (Требование 2 - POST запрос)
                const startTime = performance.now();
                const result = await userRegister.register(
                    formData.username,
                    formData.email,
                    formData.password,
                    formData.agree
                );
                const registrationTime = performance.now() - startTime;
                
                console.log('Регистрация выполнена:', {
                    result: result,
                    time: `${registrationTime.toFixed(2)}ms`
                });
                
                // Успешная регистрация
                this.showFormStatus('Регистрация успешна!', 'success');
                
                if (window.notificationManager) {
                    window.notificationManager.success('Регистрация прошла успешно!');
                }
                
                // Сохраняем результат
                this.saveRegistrationResult(result);
                
                // Очищаем форму
                this.resetForm();
                
                // Перенаправляем или показываем сообщение
                this.handleRegistrationSuccess(result);
                
            } catch (error) {
                console.error('Ошибка регистрации:', error);
                
                this.showFormStatus(`Ошибка: ${error.message}`, 'error');
                
                if (window.notificationManager) {
                    window.notificationManager.error(`Ошибка регистрации: ${error.message}`);
                }
                
                // Сохраняем ошибку для анализа
                this.saveRegistrationError(error, formData);
                
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
            const statusDiv = document.getElementById('registrationStatus') || this.createStatusElement();
            statusDiv.textContent = message;
            statusDiv.className = `form-status ${type}`;
            statusDiv.style.display = 'block';
        }
        
        /**
         * Создает элемент статуса
         * @returns {HTMLElement} Элемент статуса
         */
        createStatusElement() {
            const statusDiv = document.createElement('div');
            statusDiv.id = 'registrationStatus';
            statusDiv.style.cssText = `
                padding: 12px;
                border-radius: 8px;
                margin: 15px 0;
                text-align: center;
                display: none;
                font-weight: 500;
            `;
            
            registerForm.parentNode.insertBefore(statusDiv, registerForm.nextSibling);
            return statusDiv;
        }
        
        /**
         * Сохраняет результат регистрации
         * @param {Object} result - Результат
         */
        saveRegistrationResult(result) {
            try {
                const registrationResults = JSON.parse(localStorage.getItem('registration_results') || '[]');
                
                registrationResults.push({
                    ...result,
                    savedAt: new Date().toISOString(),
                    page: window.location.pathname
                });
                
                localStorage.setItem('registration_results', JSON.stringify(registrationResults));
            } catch (error) {
                console.error('Ошибка сохранения результата регистрации:', error);
            }
        }
        
        /**
         * Сохраняет ошибку регистрации
         * @param {Error} error - Ошибка
         * @param {Object} formData - Данные формы
         */
        saveRegistrationError(error, formData) {
            try {
                const registrationErrors = JSON.parse(localStorage.getItem('registration_errors') || '[]');
                
                registrationErrors.push({
                    error: error.message,
                    formData: { ...formData, password: '***' },
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent
                });
                
                localStorage.setItem('registration_errors', JSON.stringify(registrationErrors));
            } catch (error) {
                console.error('Ошибка сохранения ошибки регистрации:', error);
            }
        }
        
        /**
         * Обрабатывает успешную регистрацию
         * @param {Object} result - Результат
         */
        handleRegistrationSuccess(result) {
            // Сохраняем данные пользователя
            localStorage.setItem('new_user', JSON.stringify({
                username: result.user?.username,
                email: result.user?.email,
                registeredAt: new Date().toISOString(),
                userId: result.userId
            }));
            
            // Показываем сообщение об успехе
            const successMessage = document.createElement('div');
            successMessage.id = 'registrationSuccess';
            successMessage.style.cssText = `
                padding: 20px;
                background-color: #d1fae5;
                border: 1px solid #a7f3d0;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
            `;
            
            successMessage.innerHTML = `
                <h3 style="color: #065f46; margin-bottom: 10px;">🎉 Регистрация успешна!</h3>
                <p>Добро пожаловать, ${result.user?.username}!</p>
                <p>На ваш email ${result.user?.email} отправлено письмо с подтверждением.</p>
                <div style="margin-top: 15px;">
                    <button id="goToLogin" style="margin: 5px; padding: 10px 20px; background-color: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Войти в аккаунт
                    </button>
                    <button id="goToHome" style="margin: 5px; padding: 10px 20px; background-color: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        На главную
                    </button>
                </div>
            `;
            
            registerForm.parentNode.replaceChild(successMessage, registerForm);
            
            // Обработчики кнопок
            document.getElementById('goToLogin')?.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
            
            document.getElementById('goToHome')?.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
            
            // Автоматическое перенаправление через 5 секунд
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 5000);
        }
        
        /**
         * Сбрасывает форму
         */
        resetForm() {
            registerForm.reset();
            Object.keys(formState.validationErrors).forEach(fieldName => {
                this.removeFieldMessages(fieldName);
                const fieldElement = this.getFieldElement(fieldName);
                if (fieldElement) {
                    fieldElement.style.borderColor = '';
                    fieldElement.removeAttribute('aria-invalid');
                }
            });
            
            // Удаляем индикатор сложности пароля
            const indicator = document.getElementById('passwordStrengthIndicator');
            if (indicator) indicator.remove();
            
            console.log('Форма регистрации сброшена');
        }
    }
    
    // === Создание недостающих элементов ===
    
    /**
     * Создает поле подтверждения пароля
     * @returns {HTMLElement} Созданное поле
     */
    function createConfirmPasswordField() {
        if (!passwordInput) return null;
        
        const container = passwordInput.parentNode;
        const confirmField = document.createElement('input');
        confirmField.type = 'password';
        confirmField.id = 'confirmPassword';
        confirmField.name = 'confirmPassword';
        confirmField.placeholder = 'Повторите пароль';
        confirmField.required = true;
        confirmField.style.cssText = passwordInput.style.cssText;
        
        const label = document.createElement('label');
        label.htmlFor = 'confirmPassword';
        label.textContent = 'Подтверждение пароля';
        
        container.parentNode.insertBefore(label, container.nextSibling);
        container.parentNode.insertBefore(confirmField, label.nextSibling);
        
        return confirmField;
    }
    
    /**
     * Создает форму регистрации
     * @returns {HTMLElement} Созданная форма
     */
    function createRegisterForm() {
        const main = document.querySelector('main');
        if (!main) return null;
        
        const form = document.createElement('form');
        form.id = 'registerForm';
        form.className = 'form-container';
        form.innerHTML = `
            <h2>Регистрация нового аккаунта</h2>
            
            <div class="form-group">
                <label for="regUsername">Имя пользователя</label>
                <input type="text" id="regUsername" name="username" required>
                <div class="field-hint"></div>
            </div>
            
            <div class="form-group">
                <label for="regEmail">Email адрес</label>
                <input type="email" id="regEmail" name="email" required>
                <div class="field-hint"></div>
            </div>
            
            <div class="form-group">
                <label for="regPassword">Пароль</label>
                <input type="password" id="regPassword" name="password" required>
                <div class="field-hint"></div>
            </div>
            
            <div class="form-group">
                <label for="confirmPassword">Подтверждение пароля</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
                <div class="field-hint"></div>
            </div>
            
            <div class="form-group">
                <div class="checkbox-group">
                    <input type="checkbox" id="regAgree" name="agree" required>
                    <label for="regAgree">
                        Я согласен на обработку персональных данных и принимаю 
                        <a href="#" style="color: #3b82f6;">условия использования</a>
                    </label>
                </div>
            </div>
            
            <button type="submit" id="registerSubmit" class="submit-btn">
                Зарегистрироваться
            </button>
            
            <div style="text-align: center; margin-top: 20px;">
                <p>Уже есть аккаунт? <a href="login.html" style="color: #3b82f6;">Войдите</a></p>
            </div>
        `;
        
        main.appendChild(form);
        return form;
    }
    
    /**
     * Создает страницу регистрации
     */
    function createRegistrationPage() {
        const main = document.querySelector('main');
        if (!main) return;
        
        // Очищаем main
        main.innerHTML = '';
        
        // Создаем заголовок
        const header = document.createElement('header');
        header.style.cssText = `
            text-align: center;
            margin-bottom: 30px;
        `;
        header.innerHTML = `
            <h1>Регистрация</h1>
            <p>Создайте новый аккаунт для доступа ко всем возможностям сайта</p>
        `;
        
        main.appendChild(header);
        
        // Создаем форму
        createRegisterForm();
        
        // Добавляем информацию
        const info = document.createElement('div');
        info.className = 'registration-info';
        info.style.cssText = `
            max-width: 600px;
            margin: 30px auto;
            padding: 20px;
            background-color: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        `;
        info.innerHTML = `
            <h3 style="color: #1e40af; margin-bottom: 15px;">Преимущества регистрации:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">✓ Доступ ко всем материалам портфолио</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">✓ Возможность связаться с автором</li>
                <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">✓ Получение уведомлений о новых работах</li>
                <li style="padding: 8px 0;">✓ Персональные рекомендации</li>
            </ul>
        `;
        
        main.appendChild(info);
    }
    
    // === Инициализация ===
    
    console.log('Запуск менеджера формы регистрации');
    const formManager = new RegistrationFormManager();
    
    // Сохраняем данные формы при изменении
    [usernameInput, emailInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                formManager.saveFormData();
            });
        }
    });
    
    // Экспортируем для отладки
    window.registrationFormManager = formManager;
    window.registrationValidator = formManager.validator;
    
    console.log('Страница регистрации инициализирована:', {
        formManager: !!formManager,
        userRegister: !!userRegister,
        hasForm: !!registerForm
    });
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initRegistrationPage
    };
}