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

        <script>
            (function () {
                try {
                    var saved = localStorage.getItem('agenda-theme');
                    var theme = (saved === 'light' || saved === 'dark')
                        ? saved
                        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                    document.documentElement.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
                } catch (e) {
                    document.documentElement.classList.add('theme-dark');
                }
            })();
        </script>

        <style>
            *, *::before, *::after { box-sizing: border-box; }
            html, body {
                margin: 0;
                padding: 0;
                background: #f4efe6;
                color: #1d1a16;
                font-family: 'Inter', 'Segoe UI', sans-serif;
            }
            html.theme-dark, html.theme-dark body {
                background: #0f1117;
                color: #ede8e0;
            }
        </style>
    </head>
    <body class="antialiased">
        @inertia
    </body>
</html>
