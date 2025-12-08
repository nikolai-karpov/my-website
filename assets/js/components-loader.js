document.addEventListener("DOMContentLoaded", function () {
    // Определяем, запущены ли мы на GitHub Pages или локально
    const isGitHub = window.location.hostname.includes('github.io');
    // Если GitHub - добавляем префикс репозитория, иначе (локально) - пустая строка
    // ВАЖНО: Если локально ты запускаешь не из корня, скорректируй логику
    const basePath = isGitHub ? '/my-website' : ''; 

    const components = [
        { id: "header", url: `${basePath}/site-components/header.html` },
        { id: "footer", url: `${basePath}/site-components/footer.html` }
    ];

    components.forEach(component => {
        const element = document.getElementById(component.id);
        if (element) {
            fetch(component.url)
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to load ${component.url}`);
                    return response.text();
                })
                .then(data => {
                    // ВАЖНО: Внутри загруженного HTML (например, в меню) ссылки тоже могут быть без префикса.
                    // Нужно заменить href="/" на href="/my-website/" если мы на GitHub
                    let processedData = data;
                    if (isGitHub) {
                         // Простая замена путей от корня на пути с префиксом
                         // Ищем href="/... и заменяем, исключая уже правильные пути
                         processedData = data.replace(/href="\/([^\"]*)"/g, 'href="/my-website/$1"');
                    }
                    
                    element.innerHTML = processedData;
                    
                    // Перезапуск логики для хедера (мобильное меню)
                    if (component.id === 'header') {
                        document.dispatchEvent(new Event('headerLoaded'));
                    }
                })
                .catch(error => console.error('Error loading component:', error));
        }
    });
});