<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Define the common password for all seeded users
        $password = 'password123!';

        $users = [
            ['first_name' => 'CEO', 'last_name' => 'User', 'email' => 'ceo@buildsphere.com', 'role' => 'CEO'],
            ['first_name' => 'Project', 'last_name' => 'Engineer', 'email' => 'projeng@buildsphere.com', 'role' => 'Project Engineer'],
            ['first_name' => 'Project', 'last_name' => 'Coordinator', 'email' => 'projcoor@buildsphere.com', 'role' => 'Project Coordinator'],
            ['first_name' => 'Sales', 'last_name' => 'User', 'email' => 'sales@buildsphere.com', 'role' => 'Sales'],
            ['first_name' => 'Accounting', 'last_name' => 'User', 'email' => 'accounting@buildsphere.com', 'role' => 'Accounting'],
            ['first_name' => 'Procurement', 'last_name' => 'User', 'email' => 'procurement@buildsphere.com', 'role' => 'Procurement'],
            ['first_name' => 'HR', 'last_name' => 'User', 'email' => 'hr@buildsphere.com', 'role' => 'Human Resource'],
            ['first_name' => 'Staff', 'last_name' => 'User', 'email' => 'staff@buildsphere.com', 'role' => 'Staff'],
            ['first_name' => 'Foreman', 'last_name' => 'User', 'email' => 'foreman@buildsphere.com', 'role' => 'Foreman'],
        ];

        foreach ($users as $userData) {
            User::factory()->create(array_merge($userData, [
                'password' => $password,
                'email_verified_at' => now(),
            ]));
        }

        // Seed clients and projects
        $this->call([
            ClientSeeder::class,
            ProjectSeeder::class,
            TaskSeeder::class,
        ]);
    }
}
