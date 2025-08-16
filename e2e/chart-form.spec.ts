import { test, expect } from '@playwright/test';

test.describe('Chart Form', () => {
  test('should start with empty form and reset properly', async ({ page }) => {
    // Переходим на страницу
    await page.goto('/chart');

    // Проверяем, что форма пустая при первом открытии
    await expect(page.locator('input[id="name"]')).toHaveValue('');
    await expect(page.locator('input[id="date"]')).toHaveValue('');
    await expect(page.locator('input[id="time"]')).toHaveValue('');
    await expect(page.locator('input[id="place"]')).toHaveValue('');

    // Проверяем, что кнопка "Рассчитать карту" заблокирована
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    // Заполняем форму
    await page.fill('input[id="name"]', 'Тестовый Пользователь');
    await page.fill('input[id="date"]', '1990-01-01');
    await page.fill('input[id="time"]', '12:00');
    
    // Вводим место и выбираем из списка
    await page.fill('input[id="place"]', 'Moscow');
    await page.waitForSelector('.absolute.z-10', { timeout: 5000 });
    
    // Кликаем на первый результат
    await page.click('.absolute.z-10 button:first-child');

    // Проверяем, что кнопка стала активной
    await expect(page.locator('button[type="submit"]')).toBeEnabled();

    // Симулируем расчет (без реального API вызова, можно замокать)
    // Кликаем на "Новый расчёт"
    await page.click('button:has-text("Новый расчёт")');

    // Проверяем, что форма очистилась
    await expect(page.locator('input[id="name"]')).toHaveValue('');
    await expect(page.locator('input[id="date"]')).toHaveValue('');
    await expect(page.locator('input[id="time"]')).toHaveValue('');
    await expect(page.locator('input[id="place"]')).toHaveValue('');

    // Проверяем, что кнопка снова заблокирована
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should handle unknown time checkbox', async ({ page }) => {
    await page.goto('/chart');

    // Заполняем базовые поля
    await page.fill('input[id="name"]', 'Тест');
    await page.fill('input[id="date"]', '1990-01-01');
    await page.fill('input[id="time"]', '15:30');

    // Проверяем, что время введено
    await expect(page.locator('input[id="time"]')).toHaveValue('15:30');

    // Отмечаем "Не знаю точное время"
    await page.check('input[type="checkbox"]');

    // Проверяем, что поле времени заблокировано и очищено
    await expect(page.locator('input[id="time"]')).toBeDisabled();
    await expect(page.locator('input[id="time"]')).toHaveValue('');

    // Проверяем, что появилось предупреждение
    await expect(page.locator('text=Будет использовано 12:00')).toBeVisible();

    // Снимаем галочку
    await page.uncheck('input[type="checkbox"]');

    // Проверяем, что поле снова активно
    await expect(page.locator('input[id="time"]')).toBeEnabled();
  });

  test('should show advanced section', async ({ page }) => {
    await page.goto('/chart');

    // Проверяем, что расширенная секция скрыта
    await expect(page.locator('text=Координаты')).not.toBeVisible();

    // Кликаем на "Дополнительно"
    await page.click('button:has-text("Дополнительно")');

    // Проверяем, что расширенная секция появилась
    await expect(page.locator('text=Координаты')).toBeVisible();
    await expect(page.locator('text=Часовой пояс')).toBeVisible();
    await expect(page.locator('text=Система домов')).toBeVisible();

    // Проверяем, что поля координат и таймзоны readonly
    await expect(page.locator('input[placeholder="Широта"]')).toHaveAttribute('readonly');
    await expect(page.locator('input[placeholder="Долгота"]')).toHaveAttribute('readonly');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/chart');

    // Проверяем валидацию имени
    await page.fill('input[id="name"]', '   '); // Только пробелы
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    await page.fill('input[id="name"]', 'Тест');
    await expect(page.locator('button[type="submit"]')).toBeDisabled(); // Все еще нужны остальные поля

    // Добавляем дату
    await page.fill('input[id="date"]', '1990-01-01');
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    // Добавляем время
    await page.fill('input[id="time"]', '12:00');
    await expect(page.locator('button[type="submit"]')).toBeDisabled(); // Нужно место

    // Вводим место и выбираем
    await page.fill('input[id="place"]', 'London');
    await page.waitForSelector('.absolute.z-10', { timeout: 5000 });
    await page.click('.absolute.z-10 button:first-child');

    // Теперь кнопка должна быть активна
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('should search and select places', async ({ page }) => {
    await page.goto('/chart');

    // Начинаем вводить место
    await page.fill('input[id="place"]', 'Par');

    // Ждем появления списка предложений
    await page.waitForSelector('.absolute.z-10', { timeout: 5000 });

    // Проверяем, что появились предложения
    await expect(page.locator('.absolute.z-10 button')).toHaveCount.greaterThan(0);

    // Выбираем первое предложение
    const firstSuggestion = page.locator('.absolute.z-10 button').first();
    await firstSuggestion.click();

    // Проверяем, что поле заполнилось
    await expect(page.locator('input[id="place"]')).not.toHaveValue('Par');
    await expect(page.locator('input[id="place"]')).not.toHaveValue('');

    // Проверяем, что список предложений исчез
    await expect(page.locator('.absolute.z-10')).not.toBeVisible();

    // Открываем расширенную секцию и проверяем координаты
    await page.click('button:has-text("Дополнительно")');
    
    // Координаты должны быть заполнены
    await expect(page.locator('input[placeholder="Широта"]')).not.toHaveValue('');
    await expect(page.locator('input[placeholder="Долгота"]')).not.toHaveValue('');
  });
});