import { expect, Page } from '@playwright/test';
import { test } from '../helpers';

test.describe('Initial Smoke Test', () => {

    const lessonsTitle = 'Guitar lessons';

    async function checkUrl(page:Page){
        return await expect(page).toHaveURL(`http://localhost:${process.env.PORT}/lessons`);
    }

    async function checkTitle(page:Page) {
        await expect(page.locator('#title')).toHaveText(lessonsTitle,{timeout:500});
    }

    async function openRegistrationPane(page:Page) {
        // Click #first
        await page.locator('#first').click({timeout: 750});

        // text=Registration Details is visible
        await expect(page.locator('text=Registration Details')).toBeVisible({timeout:1000});
    }

    test('URL Navigation', async ({ page }) => {
    
        // Go to http://localhost:${process.env.PORT}/
        await page.goto(`http://localhost:${process.env.PORT}/`, {timeout:5000});
        
        // Go to http://localhost:${process.env.PORT}/lessons
        await page.goto(`http://localhost:${process.env.PORT}/lessons`, { waitUntil: 'networkidle' });

        await checkTitle(page);
        await openRegistrationPane(page);
    });

    test('Navbar Navigation', async ({ page }) => {
        
        // Go to http://localhost:${process.env.PORT}/
        await page.goto(`http://localhost:${process.env.PORT}/`, {timeout:5000});
        
        // Click text=Lessons Courses
        await page.locator('text=Lessons Courses').click({timeout: 1000});
        
        await checkUrl(page);
        await checkTitle(page);
        await openRegistrationPane(page);
    });

    test('Button Navigation', async ({ page }) => {

        // Go to http://localhost:${process.env.PORT}/
        await page.goto(`http://localhost:${process.env.PORT}/`, {timeout:5000});
        
        // Click #lessons
        await page.locator('#lessons').click({timeout:1000});

        await checkUrl(page);
        await checkTitle(page);
        await openRegistrationPane(page);
    });
});
