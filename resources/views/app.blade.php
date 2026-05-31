<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="AgendaPro — Agenda Telefónica SPA con Laravel, Inertia.js y Vue 3">

        <title inertia>{{ config('app.name', 'AgendaPro') }}</title>

        <!-- Fuente Inter desde Google Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet" />

        <!-- Scripts de Inertia -->
        @routes
        @vite(['resources/js/app.js', "resources/js/Pages/{$page['component']}.vue"])
        @inertiaHead

        <style>
            *, *::before, *::after { box-sizing: border-box; }
            html, body {
                margin: 0;
                padding: 0;
                background: #0f1117;
                font-family: 'Inter', 'Segoe UI', sans-serif;
            }
        </style>
    </head>
    <body class="antialiased">
        @inertia
    </body>
</html>
