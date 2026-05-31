<?php

use App\Http\Controllers\PersonaController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PersonaController::class, 'index'])->name('agenda.index');
Route::post('/personas', [PersonaController::class, 'store'])->name('agenda.store');
Route::post('/personas/{per_cod}/foto', [PersonaController::class, 'update'])->name('agenda.update');

