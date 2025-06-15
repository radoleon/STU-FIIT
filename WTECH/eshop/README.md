# Furniture E-Shop

### Description  
This is a PHP Laravel-based web application that simulates an online furniture store. It includes both a customer-facing interface and an admin panel for managing products.

### Features  

#### **Customer View**
- User registration, login, and logout
- Browsing product listings with pagination
- Searching products by name (case-insensitive)
- Filtering products by category, color, material, room, and price range
- Sorting products by price or alphabetically
- Adding products to the cart (even without login via session storage)
- Updating product quantities in the cart
- Placing a simulated order

#### **Admin View**
- Admin login via `/admin-login`
- Managing products (create, edit, delete, view)
- Predefined admin account with restricted access

### Setup  
To run this project locally, follow these steps:

1. Install PHP dependencies:  
```
composer install
```
2. Copy the environment file:
```
cp .env.example .env
```
3. Configure the .env file with your database credentials:
```
DB_CONNECTION=pgsql  
DB_HOST=127.0.0.1  
DB_PORT=5432  
DB_DATABASE=your_db_name  
DB_USERNAME=your_username  
DB_PASSWORD=your_password  
SESSION_DRIVER=database  
SESSION_LIFETIME=120
```
4. Run database migrations:
```
php artisan migrate:fresh
```
5. Seed the database with initial data:
```
php artisan db:seed
```
6. Create symbolic link for file storage:
```
php artisan storage:link
```
7. Install frontend packages:
```
npm install
```
8. Start the development server:
```
php artisan serve
```
### Technologies
![](https://skillicons.dev/icons?i=laravel,figma)

> [!NOTE]
> This project was developed as a team collaboration between two developers.
