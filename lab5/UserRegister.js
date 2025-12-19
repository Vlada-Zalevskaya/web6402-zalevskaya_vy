// UserRegister.js - класс для управления процессом регистрации

class UserRegister {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000';
        this.isRegistering = false;
        this.minPasswordLength = 8;
        this.maxPasswordLength = 100;
        this.passwordRequirements = {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false
        };
    }

    /**
     * Регистрирует нового пользователя
     * @param {string} username - Имя пользователя
     * @param {string} email - Email пользователя
     * @param {string} password - Пароль пользователя
     * @param {boolean} agreeToTerms - Согласие с условиями
     * @returns {Promise<Object>} Результат регистрации
     */
    async register(username, email, password, agreeToTerms) {
        if (this.isRegistering) {
            throw new Error('Процесс регистрации уже выполняется');
        }

        if (!agreeToTerms) {
            throw new Error('Необходимо согласие на обработку данных');
        }

        this.isRegistering = true;

        try {
            // 1. Валидация данных на клиенте
            this.validateRegistrationData(username, email, password, agreeToTerms);

            // 2. Проверка существования пользователя
            const userExists = await this.checkUserExists(username, email);
            if (userExists.exists) {
                throw new Error('Пользователь с таким email или логином уже существует');
            }

            // 3. Отправка POST-запроса на сервер (требование 2)
            const response = await fetch(`${this.apiBaseUrl}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    id: this.generateUserId(),
                    username: username,
                    email: email,
                    password: this.hashPassword(password), // В реальном приложении пароль хэшируется на сервере
                    agreeToTerms: agreeToTerms,
                    registeredAt: new Date().toISOString(),
                    role: 'user',
                    status: 'active',
                    emailVerified: false,
                    registrationSource: 'website',
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    screenResolution: `${screen.width}x${screen.height}`,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            });

            // 4. Обработка ответа сервера
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Ошибка сервера: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            // 5. Проверка успешности операции
            if (!result.success && result.success !== undefined) {
                throw new Error(result.message || 'Ошибка регистрации');
            }

            // 6. Логирование успешной регистрации
            this.logRegistration(username, email, true, 'Успешная регистрация');

            // 7. Сохранение данных пользователя (без пароля)
            this.saveUserData({
                id: result.id || this.generateUserId(),
                username: username,
                email: email,
                registeredAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                status: 'active'
            });

            // 8. Отправка события о регистрации
            window.dispatchEvent(new CustomEvent('userRegistered', {
                detail: {
                    username: username,
                    email: email,
                    timestamp: new Date().toISOString(),
                    userId: result.id || this.generateUserId()
                }
            }));

            console.log('Регистрация успешна:', {
                username: username,
                email: email,
                timestamp: new Date().toISOString()
            });

            return {
                success: true,
                message: 'Регистрация успешна',
                data: result.data || result,
                userId: result.id || this.generateUserId(),
                timestamp: new Date().toISOString(),
                user: {
                    username: username,
                    email: email,
                    registeredAt: new Date().toISOString()
                }
            };

        } catch (error) {
            // Логирование ошибки регистрации
            this.logRegistration(username, email, false, error.message);
            
            console.error('Ошибка регистрации:', error);
            
            // Отправка события об ошибке
            window.dispatchEvent(new CustomEvent('registrationFailed', {
                detail: {
                    username: username,
                    email: email,
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            }));
            
            throw error;
        } finally {
            this.isRegistering = false;
        }
    }

    /**
     * Валидирует данные регистрации (требование 1 - динамическая проверка)
     * @param {string} username - Имя пользователя
     * @param {string} email - Email пользователя
     * @param {string} password - Пароль пользователя
     * @param {boolean} agreeToTerms - Согласие с условиями
     * @throws {Error} Если данные невалидны
     */
    validateRegistrationData(username, email, password, agreeToTerms) {
        const errors = [];

        // Валидация логина
        const usernameValidation = this.validateUsername(username);
        if (usernameValidation !== '') {
            errors.push(usernameValidation);
        }

        // Валидация email
        const emailValidation = this.validateEmail(email);
        if (emailValidation !== '') {
            errors.push(emailValidation);
        }

        // Валидация пароля
        const passwordValidation = this.validatePassword(password);
        if (passwordValidation !== '') {
            errors.push(passwordValidation);
        }

        // Валидация согласия
        if (!agreeToTerms) {
            errors.push('Необходимо согласие на обработку персональных данных');
        }

        if (errors.length > 0) {
            throw new Error(errors.join('. '));
        }
    }

    /**
     * Валидирует имя пользователя
     * @param {string} username - Имя пользователя
     * @returns {string} Сообщение об ошибке или пустая строка
     */
    validateUsername(username) {
        if (!username || username.trim() === '') {
            return 'Логин обязателен для заполнения';
        }
        
        if (username.length < 3) {
            return 'Логин должен содержать не менее 3 символов';
        }
        
        if (username.length > 20) {
            return 'Логин должен содержать не более 20 символов';
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return 'Логин может содержать только латинские буквы, цифры и подчеркивание';
        }
        
        // Проверка запрещенных слов
        const forbiddenWords = ['admin', 'root', 'moderator', 'system'];
        if (forbiddenWords.includes(username.toLowerCase())) {
            return 'Это имя пользователя запрещено';
        }
        
        return '';
    }

    /**
     * Валидирует email
     * @param {string} email - Email пользователя
     * @returns {string} Сообщение об ошибке или пустая строка
     */
    validateEmail(email) {
        if (!email || email.trim() === '') {
            return 'Email обязателен для заполнения';
        }
        
        if (!this.isValidEmail(email)) {
            return 'Введите корректный email';
        }
        
        // Проверка домена
        const domain = email.split('@')[1];
        const invalidDomains = ['example.com', 'test.com', 'mailinator.com'];
        if (invalidDomains.includes(domain.toLowerCase())) {
            return 'Пожалуйста, используйте реальный email адрес';
        }
        
        return '';
    }

    /**
     * Валидирует пароль
     * @param {string} password - Пароль пользователя
     * @returns {string} Сообщение об ошибке или пустая строка
     */
    validatePassword(password) {
        if (!password || password.trim() === '') {
            return 'Пароль обязателен для заполнения';
        }
        
        const requirements = this.passwordRequirements;
        const errors = [];
        
        if (password.length < requirements.minLength) {
            errors.push(`не менее ${requirements.minLength} символов`);
        }
        
        if (password.length > this.maxPasswordLength) {
            errors.push(`не более ${this.maxPasswordLength} символов`);
        }
        
        if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('хотя бы одну заглавную букву');
        }
        
        if (requirements.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('хотя бы одну строчную букву');
        }
        
        if (requirements.requireNumbers && !/\d/.test(password)) {
            errors.push('хотя бы одну цифру');
        }
        
        if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('хотя бы один специальный символ');
        }
        
        // Проверка на слабые пароли
        const weakPasswords = ['password', '123456', 'qwerty', 'admin'];
        if (weakPasswords.includes(password.toLowerCase())) {
            errors.push('использовать более надежный пароль');
        }
        
        if (errors.length > 0) {
            return `Пароль должен содержать: ${errors.join(', ')}`;
        }
        
        return '';
    }

    /**
     * Проверяет валидность email
     * @param {string} email - Email для проверки
     * @returns {boolean} true если email валиден
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Генерирует ID пользователя
     * @returns {string} Уникальный ID
     */
    generateUserId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Хэширует пароль (заглушка для демонстрации)
     * @param {string} password - Пароль
     * @returns {string} Хэшированный пароль
     */
    hashPassword(password) {
        // В реальном приложении хэширование должно выполняться на сервере
        // Здесь только демонстрация для mock-сервера
        return btoa(password.substring(0, 3) + '***');
    }

    /**
     * Проверяет существование пользователя
     * @param {string} username - Имя пользователя
     * @param {string} email - Email пользователя
     * @returns {Promise<Object>} Результат проверки
     */
    async checkUserExists(username, email) {
        try {
            // В реальном приложении здесь был бы запрос к API
            // Для mock-сервера проверяем localStorage
            
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            
            const existingUser = registeredUsers.find(user => 
                user.username === username || user.email === email
            );
            
            return {
                exists: !!existingUser,
                user: existingUser,
                checkedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Ошибка проверки пользователя:', error);
            return { 
                exists: false, 
                error: error.message,
                checkedAt: new Date().toISOString()
            };
        }
    }

    /**
     * Логирует регистрацию
     * @param {string} username - Имя пользователя
     * @param {string} email - Email пользователя
     * @param {boolean} success - Успешность операции
     * @param {string} message - Сообщение
     */
    logRegistration(username, email, success, message) {
        try {
            const registrations = JSON.parse(localStorage.getItem('userRegistrations') || '[]');
            
            const registration = {
                username: username,
                email: email,
                success: success,
                message: message,
                timestamp: new Date().toISOString(),
                ip: '127.0.0.1', // В реальном приложении получаем с сервера
                userAgent: navigator.userAgent,
                referrer: document.referrer || 'direct'
            };
            
            registrations.push(registration);
            
            // Ограничиваем историю 100 записями
            if (registrations.length > 100) {
                registrations.shift();
            }
            
            localStorage.setItem('userRegistrations', JSON.stringify(registrations));

            // Отправляем событие
            window.dispatchEvent(new CustomEvent('registrationLogged', {
                detail: registration
            }));

            console.log(`Регистрация ${success ? 'успешна' : 'неуспешна'}:`, registration);

        } catch (error) {
            console.error('Ошибка логирования регистрации:', error);
        }
    }

    /**
     * Сохраняет данные пользователя
     * @param {Object} userData - Данные пользователя
     */
    saveUserData(userData) {
        try {
            // Сохраняем в список зарегистрированных пользователей
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            
            // Удаляем старую запись если существует
            const existingIndex = registeredUsers.findIndex(u => u.email === userData.email);
            if (existingIndex !== -1) {
                registeredUsers[existingIndex] = userData;
            } else {
                registeredUsers.push(userData);
            }
            
            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
            
            // Сохраняем как текущего пользователя
            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('isRegistered', 'true');
            localStorage.setItem('registrationDate', new Date().toISOString());

        } catch (error) {
            console.error('Ошибка сохранения данных пользователя:', error);
            throw new Error('Не удалось сохранить данные пользователя');
        }
    }

    /**
     * Получает статистику регистраций
     * @returns {Object} Статистика
     */
    getRegistrationStats() {
        try {
            const registrations = JSON.parse(localStorage.getItem('userRegistrations') || '[]');
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            
            const successful = registrations.filter(r => r.success).length;
            const failed = registrations.filter(r => !r.success).length;
            const total = registrations.length;
            
            // Группировка по дням
            const registrationsByDay = this.groupRegistrationsByDay(registrations);
            
            // Последние регистрации
            const lastRegistrations = registrations.slice(-5).reverse();
            
            return {
                totalRegistrations: total,
                successful: successful,
                failed: failed,
                successRate: total > 0 ? (successful / total * 100).toFixed(2) : 0,
                totalUsers: registeredUsers.length,
                lastRegistration: registrations[registrations.length - 1] || null,
                registrationsByDay: registrationsByDay,
                lastRegistrations: lastRegistrations,
                todayRegistrations: this.getTodayRegistrations(registrations)
            };
        } catch (error) {
            console.error('Ошибка получения статистики:', error);
            return {
                totalRegistrations: 0,
                successful: 0,
                failed: 0,
                successRate: 0,
                totalUsers: 0
            };
        }
    }

    /**
     * Группирует регистрации по дням
     * @param {Array} registrations - Массив регистраций
     * @returns {Object} Группированные данные
     */
    groupRegistrationsByDay(registrations) {
        const groups = {};
        
        registrations.forEach(reg => {
            const date = new Date(reg.timestamp).toLocaleDateString('ru-RU');
            if (!groups[date]) {
                groups[date] = {
                    date: date,
                    successful: 0,
                    failed: 0,
                    total: 0
                };
            }
            
            groups[date].total++;
            if (reg.success) {
                groups[date].successful++;
            } else {
                groups[date].failed++;
            }
        });
        
        return groups;
    }

    /**
     * Получает регистрации за сегодня
     * @param {Array} registrations - Массив регистраций
     * @returns {Array} Регистрации за сегодня
     */
    getTodayRegistrations(registrations) {
        const today = new Date().toLocaleDateString('ru-RU');
        return registrations.filter(reg => {
            const regDate = new Date(reg.timestamp).toLocaleDateString('ru-RU');
            return regDate === today;
        });
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
        
        // Разнообразие символов
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        
        // Оценка
        let strength = 'очень слабый';
        if (score >= 6) strength = 'очень сильный';
        else if (score >= 5) strength = 'сильный';
        else if (score >= 4) strength = 'средний';
        else if (score >= 3) strength = 'слабый';
        
        // Рекомендации
        if (password.length < 8) {
            feedback.push('Увеличьте длину пароля до 8+ символов');
        }
        if (!/[A-Z]/.test(password)) {
            feedback.push('Добавьте заглавные буквы');
        }
        if (!/\d/.test(password)) {
            feedback.push('Добавьте цифры');
        }
        
        return {
            score: score,
            maxScore: 6,
            strength: strength,
            feedback: feedback,
            isStrong: score >= 4
        };
    }

    /**
     * Отправляет email подтверждения (заглушка)
     * @param {string} email - Email пользователя
     * @returns {Promise<Object>} Результат операции
     */
    async sendConfirmationEmail(email) {
        // В реальном приложении здесь был бы запрос к API
        return {
            success: true,
            message: 'Email подтверждения отправлен',
            email: email,
            timestamp: new Date().toISOString(),
            expiresIn: '24 часа'
        };
    }

    /**
     * Верифицирует email (заглушка)
     * @param {string} token - Токен подтверждения
     * @returns {Promise<Object>} Результат операции
     */
    async verifyEmail(token) {
        // В реальном приложении здесь был бы запрос к API
        return {
            success: true,
            message: 'Email успешно подтвержден',
            timestamp: new Date().toISOString(),
            verified: true
        };
    }

    /**
     * Получает текущего зарегистрированного пользователя
     * @returns {Object|null} Данные пользователя
     */
    getCurrentUser() {
        try {
            const userData = localStorage.getItem('currentUser');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Ошибка получения данных пользователя:', error);
            return null;
        }
    }

    /**
     * Проверяет, зарегистрирован ли пользователь
     * @returns {boolean} true если пользователь зарегистрирован
     */
    isUserRegistered() {
        try {
            const isRegistered = localStorage.getItem('isRegistered') === 'true';
            const userData = this.getCurrentUser();
            
            return isRegistered && !!userData;
        } catch (error) {
            console.error('Ошибка проверки регистрации:', error);
            return false;
        }
    }

    /**
     * Очищает данные регистрации
     */
    clearRegistrationData() {
        try {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isRegistered');
            localStorage.removeItem('registrationDate');
            
            console.log('Данные регистрации очищены');
            
            return {
                success: true,
                message: 'Данные регистрации очищены',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Ошибка очистки данных:', error);
            throw error;
        }
    }
}

// Экспорт класса для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserRegister;
}