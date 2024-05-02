const selectBox = document.getElementById('versionSelect');

if (selectBox) {
    // Populate the select box with options based on the versionMap
    const versionMap = { 
        'based on Percona XtraDB Cluster': '/based on Percona Server for MySQL/',
        'based on Percona Server for MySQL': '/based on Percona XtraDB Cluster/',
        // Add new versions here as needed
    };

    Object.keys(versionMap).forEach(version => {
        const option = document.createElement('option');
        option.value = version;
        option.textContent = version; // Appending the Unicode right-pointing pointer
        selectBox.appendChild(option);
    });

    // Function to extract the current version from URL
    function getCurrentVersionFromUrl() {
        const regex = /\/(\d+\.\d+)\//;
        const matches = window.location.href.match(regex);
        return matches ? matches[1] : null;
    }

    // Set initial selection based on URL
    const currentVersion = getCurrentVersionFromUrl();
    if (currentVersion) {
        selectBox.value = currentVersion;
    }

    // Add event listener for changing URL based on selection
    selectBox.addEventListener('change', function() {
        const selectedVersion = this.value;
        if (selectedVersion !== getCurrentVersionFromUrl()) {
            const newUrl = window.location.href.replace(/\/(\d+\.\d+)\//, versionMap[selectedVersion]);
            window.location.href = newUrl;
        }
    });
} else {
    console.log("No version selector available on this website.");
}
