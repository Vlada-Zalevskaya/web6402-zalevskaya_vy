// notifications.js - утилиты для отображения уведомлений

class NotificationManager {
    constructor() {
        this.notificationContainer = null;
        this.createNotificationContainer();
    }

    createNotificationContainer() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.id = 'notification-container';
        this.notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(this.notificationContainer);
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background-color: ${this.getBackgroundColor(type)};
            color: ${this.getTextColor(type)};
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: inherit;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            margin-left: 10px;
        `;
        closeBtn.onclick = () => this.removeNotification(notification);

        notification.appendChild(messageSpan);
        notification.appendChild(closeBtn);
        this.notificationContainer.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => this.removeNotification(notification), duration);
        }

        return notification;
    }

    removeNotification(notification) {
        if (notification.parentNode === this.notificationContainer) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode === this.notificationContainer) {
                    this.notificationContainer.removeChild(notification);
                }
            }, 300);
        }
    }

    getBackgroundColor(type) {
        const colors = {
            success: '#d1fae5',
            error: '#fee2e2',
            warning: '#fef3c7',
            info: '#dbeafe'
        };
        return colors[type] || colors.info;
    }

    getTextColor(type) {
        const colors = {
            success: '#065f46',
            error: '#991b1b',
            warning: '#92400e',
            info: '#1e40af'
        };
        return colors[type] || colors.info;
    }

    success(message, duration = 3000) {
        return this.showNotification(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.showNotification(message, 'error', duration);
    }

    info(message, duration = 3000) {
        return this.showNotification(message, 'info', duration);
    }

    warning(message, duration = 4000) {
        return this.showNotification(message, 'warning', duration);
    }
}

// Глобальный экземпляр
window.notificationManager = new NotificationManager();

// Добавляем стили анимации
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
`;
document.head.appendChild(style);