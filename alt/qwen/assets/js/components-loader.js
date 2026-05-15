document.addEventListener("DOMContentLoaded", function () {
    const isGitHub = window.location.hostname.includes("github.io");
    const altMatch = window.location.pathname.match(/^(.*\/alt\/qwen)/);
    const basePath = altMatch ? altMatch[1] : isGitHub ? "/my-website" : "";

    const components = [
        { id: "main-header", url: basePath + "/site-components/header.html" },
        { id: "main-footer", url: basePath + "/site-components/footer.html" }
    ];

    components.forEach(function (component) {
        const element = document.getElementById(component.id);
        if (!element) return;
        fetch(component.url)
            .then(function (response) {
                if (!response.ok) throw new Error("Failed to load " + component.url);
                return response.text();
            })
            .then(function (data) {
                var processedData = data;
                if (basePath) {
                    processedData = data.replace(/href="\/([^\"]*)"/g, function (_, p) {
                        if (/^(https?:|mailto:|tel:)/i.test(p)) return 'href="/' + p + '"';
                        return 'href="' + basePath + "/" + p + '"';
                    });
                }
                element.innerHTML = processedData;
                if (component.id === "main-header") {
                    document.dispatchEvent(new Event("headerLoaded"));
                }
            })
            .catch(function (e) { console.error(e); });
    });
});
