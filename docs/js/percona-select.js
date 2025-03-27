const selectBox = document.getElementById('versionSelect');

if (selectBox) {
    // Populate the select box with options based on the versionMap
    const versionMap = { 
        'based on Percona XtraDB Cluster': '/pxc/',
        'based on Percona Server for MySQL': '/ps/',
        // Add new versions here as needed
    };

    function getCurrentVersionFromUrl() {
        for (const path of Object.values(versionMap)) {
            if (window.location.pathname.includes(path)) {
                return path;  // Return the matching path as soon as one is found
            }
        }
        return null;  // Return null if no match is found
    }

    Object.keys(versionMap).forEach(version => {
        const option = document.createElement('option');
        option.value = versionMap[version];
        option.textContent = version;
        selectBox.appendChild(option);
    });

    // Set initial selection based on URL
    const currentSegment = getCurrentVersionFromUrl();
    if (currentSegment) {
        selectBox.value = currentSegment;
    }

    // Add event listener for changing URL based on selection
    selectBox.addEventListener('change', function() {
        const selectedVersion = this.value;
        const currentSegment = getCurrentVersionFromUrl();
        if (selectedVersion !== currentSegment) { // Only redirect if the selected version is different
            const newUrl = window.location.href.replace(currentSegment, selectedVersion);
            window.location.href = newUrl;
        }
    });
} else {
    console.log("No version selector available on this website.");
}
