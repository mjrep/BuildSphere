<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

$email = 'ceo@buildsphere.com';
$password = 'password123!';

$user = User::where('email', $email)->first();

if (!$user) {
    echo "User not found\n";
    exit;
}

echo "User found: " . $user->email . "\n";
echo "Password hash: " . $user->password . "\n";

$check = Hash::check($password, $user->password);
echo "Hash::check result: " . ($check ? "TRUE" : "FALSE") . "\n";

$attempt = Auth::attempt(['email' => $email, 'password' => $password]);
echo "Auth::attempt result: " . ($attempt ? "TRUE" : "FALSE") . "\n";
