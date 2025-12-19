// UserLogin.js - класс для управления процессом логина

class UserLogin {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000';
        this.isLoggingIn = false;
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
    }

    /**
     * Выполняет вход пользователя
     * @param {string} email - Email пользователя
     * @param {string} password - Пароль пользователя
     * @returns {Promise<Object>} Результат авторизации
     */
    async login(email, password) {
        if (this.isLoggingIn) {
            throw new Error('Процесс авторизации уже выполняется');
        }

        this.isLoggingIn = true;

        try {
            // Валидация данных
            this.validateLoginData(email, password);

            // Отправка запроса на сервер
            const response = await fetch(`${this.apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    action: 'login',
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    platform: navigator.platform
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Проверка успешности операции
            if (!result.success && result.success !== undefined) {
                throw new Error(result.message || 'Ошибка авторизации');
            }

            // Сохраняем данные пользователя
            this.saveUserSession({
                email: email,
                loginTime: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
                sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userAgent: navigator.userAgent,
                ipAddress: '127.0.0.1' // В реальном приложении получаем с сервера
            });

            // Логируем успешный вход
            this.logLoginAttempt(email, true, 'Успешный вход');

            return {
                success: true,
                message: 'Авторизация успешна',
                data: result.data || result,
                session: this.getUserSession(),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            // Логируем неудачную попытку входа
            this.logLoginAttempt(email, false, error.message);
            
            console.error('Ошибка авторизации:', error);
            throw error;
        } finally {
            this.isLoggingIn = false;
        }
    }

    /**
     * Валидирует данные для входа
     * @param {string} email - Email пользователя
     * @param {string} password - Пароль пользователя
     * @throws {Error} Если данные невалидны
     */
    validateLoginData(email, password) {
        const errors = [];

        if (!email || email.trim() === '') {
            errors.push('Email обязателен для заполнения');
        } else if (!this.isValidEmail(email)) {
            errors.push('Введите корректный email');
        }

        if (!password || password.trim() === '') {
            errors.push('Пароль обязателен для заполнения');
        } else if (password.length < 6) {
            errors.push('Пароль должен содержать не менее 6 символов');
        }

        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
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
     * Сохраняет сессию пользователя
     * @param {Object} userData - Данные пользователя
     */
    saveUserSession(userData) {
        try {
            // Сохраняем основную сессию
            localStorage.setItem('userSession', JSON.stringify(userData));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('lastLogin', new Date().toISOString());
            
            // Сохраняем в историю сессий
            this.addToSessionHistory(userData);
            
            // Отправляем событие об успешной авторизации
            window.dispatchEvent(new CustomEvent('userLoggedIn', {
                detail: {
                    ...userData,
                    eventTime: new Date().toISOString()
                }
            }));

            console.log('Сессия сохранена:', {
                email: userData.email,
                sessionId: userData.sessionId,
                timestamp: userData.loginTime
            });

        } catch (error) {
            console.error('Ошибка сохранения сессии:', error);
            throw new Error('Не удалось сохранить сессию');
        }
    }

    /**
     * Добавляет сессию в историю
     * @param {Object} sessionData - Данные сессии
     */
    addToSessionHistory(sessionData) {
        try {
            const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
            
            history.push({
                ...sessionData,
                addedToHistory: new Date().toISOString()
            });
            
            // Ограничиваем историю 50 записями
            if (history.length > 50) {
                history.shift();
            }
            
            localStorage.setItem('loginHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Ошибка добавления в историю:', error);
        }
    }

    /**
     * Выполняет выход пользователя
     * @returns {Object} Результат операции
     */
    logout() {
        try {
            const sessionData = this.getUserSession();
            
            // Логируем выход
            if (sessionData) {
                this.logLogout(sessionData.email);
            }

            // Удаляем данные сессии
            localStorage.removeItem('userSession');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('lastLogin');
            
            // Отправляем событие о выходе
            window.dispatchEvent(new CustomEvent('userLoggedOut', {
                detail: {
                    timestamp: new Date().toISOString(),
                    email: sessionData?.email || 'unknown'
                }
            }));

            console.log('Пользователь вышел из системы');

            return {
                success: true,
                message: 'Выход выполнен успешно',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Ошибка выхода:', error);
            throw new Error('Не удалось выполнить выход');
        }
    }

    /**
     * Проверяет, авторизован ли пользователь
     * @returns {boolean} true если пользователь авторизован
     */
    isUserLoggedIn() {
        try {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const sessionData = this.getUserSession();
            
            if (!isLoggedIn || !sessionData) {
                return false;
            }

            // Проверяем время сессии
            return this.validateSession().valid;

        } catch (error) {
            console.error('Ошибка проверки статуса авторизации:', error);
            return false;
        }
    }

    /**
     * Получает данные текущей сессии
     * @returns {Object|null} Данные сессии или null
     */
    getUserSession() {
        try {
            const sessionData = localStorage.getItem('userSession');
            return sessionData ? JSON.parse(sessionData) : null;
        } catch (error) {
            console.error('Ошибка получения данных сессии:', error);
            return null;
        }
    }

    /**
     * Проверяет валидность текущей сессии
     * @returns {Object} Результат проверки
     */
    validateSession() {
        const sessionData = this.getUserSession();
        
        if (!sessionData) {
            return { 
                valid: false, 
                reason: 'Сессия не найдена',
                code: 'NO_SESSION'
            };
        }

        // Проверяем время сессии
        const loginTime = new Date(sessionData.loginTime);
        const currentTime = new Date();
        const timeDiff = currentTime - loginTime;

        if (timeDiff > this.sessionTimeout) {
            this.logout();
            return { 
                valid: false, 
                reason: 'Сессия истекла',
                code: 'SESSION_EXPIRED',
                expiredAt: new Date(loginTime.getTime() + this.sessionTimeout).toISOString()
            };
        }

        // Обновляем время последней активности
        this.updateLastActivity();

        return { 
            valid: true, 
            data: sessionData,
            remainingTime: this.sessionTimeout - timeDiff,
            expiresIn: Math.round((this.sessionTimeout - timeDiff) / 1000 / 60) // в минутах
        };
    }

    /**
     * Обновляет время последней активности
     */
    updateLastActivity() {
        try {
            const sessionData = this.getUserSession();
            if (sessionData) {
                sessionData.lastActivity = new Date().toISOString();
                localStorage.setItem('userSession', JSON.stringify(sessionData));
            }
        } catch (error) {
            console.error('Ошибка обновления активности:', error);
        }
    }

    /**
     * Логирует попытку входа
     * @param {string} email - Email пользователя
     * @param {boolean} success - Успешность попытки
     * @param {string} message - Сообщение
     */
    logLoginAttempt(email, success, message) {
        try {
            const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
            
            const attempt = {
                email: email || 'unknown',
                success: success,
                message: message,
                timestamp: new Date().toISOString(),
                ip: '127.0.0.1', // В реальном приложении получаем с сервера
                userAgent: navigator.userAgent
            };
            
            attempts.push(attempt);
            
            // Ограничиваем логи 100 записями
            if (attempts.length > 100) {
                attempts.shift();
            }
            
            localStorage.setItem('loginAttempts', JSON.stringify(attempts));

            // Отправляем событие
            window.dispatchEvent(new CustomEvent('loginAttemptLogged', {
                detail: attempt
            }));

        } catch (error) {
            console.error('Ошибка логирования попытки входа:', error);
        }
    }

    /**
     * Логирует выход пользователя
     * @param {string} email - Email пользователя
     */
    logLogout(email) {
        try {
            const logouts = JSON.parse(localStorage.getItem('logoutLog') || '[]');
            
            logouts.push({
                email: email,
                timestamp: new Date().toISOString(),
                sessionDuration: this.calculateSessionDuration()
            });
            
            localStorage.setItem('logoutLog', JSON.stringify(logouts));

        } catch (error) {
            console.error('Ошибка логирования выхода:', error);
        }
    }

    /**
     * Рассчитывает длительность сессии
     * @returns {number} Длительность в миллисекундах
     */
    calculateSessionDuration() {
        const sessionData = this.getUserSession();
        if (!sessionData) return 0;
        
        const loginTime = new Date(sessionData.loginTime);
        const currentTime = new Date();
        return currentTime - loginTime;
    }

    /**
     * Получает статистику входов
     * @returns {Object} Статистика
     */
    getLoginStats() {
        try {
            const attempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
            const history = JSON.parse(localStorage.getItem('loginHistory') || '[]');
            
            const successful = attempts.filter(a => a.success).length;
            const failed = attempts.filter(a => !a.success).length;
            const total = attempts.length;
            
            return {
                totalAttempts: total,
                successful: successful,
                failed: failed,
                successRate: total > 0 ? (successful / total * 100).toFixed(2) : 0,
                lastAttempt: attempts[attempts.length - 1] || null,
                sessionHistory: history,
                currentSession: this.getUserSession()
            };
        } catch (error) {
            console.error('Ошибка получения статистики:', error);
            return {
                totalAttempts: 0,
                successful: 0,
                failed: 0,
                successRate: 0
            };
        }
    }

    /**
     * Сбрасывает пароль (заглушка для будущей реализации)
     * @param {string} email - Email пользователя
     * @returns {Promise<Object>} Результат операции
     */
    async resetPassword(email) {
        // В реальном приложении здесь был бы запрос к API
        return {
            success: true,
            message: 'Инструкции по сбросу пароля отправлены на email',
            email: email,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Обновляет информацию о пользователе
     * @param {Object} userData - Новые данные пользователя
     * @returns {Promise<Object>} Результат операции
     */
    async updateUserProfile(userData) {
        // В реальном приложении здесь был бы запрос к API
        return {
            success: true,
            message: 'Профиль обновлен',
            data: userData,
            timestamp: new Date().toISOString()
        };
    }
}

// Экспорт класса для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserLogin;
}