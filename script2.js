document.getElementById('simulationForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Read input values
    let pages = document.getElementById('pages').value.split(',').map(Number);
    let frameCount = parseInt(document.getElementById('frames').value);
    let algorithm = document.getElementById('algorithm').value;

    // Validation: Check if number of pages is less than the frame count
    if (frameCount > pages.length) {
        alert("Number of pages cannot be lesser than the number of frames.");
        return;
    }

    let result;
    switch (algorithm) {
        case 'FIFO':
            result = simulateFIFO(pages, frameCount);
            break;
        case 'LRU':
            result = simulateLRU(pages, frameCount);
            break;
        case 'Optimal':
            result = simulateOptimal(pages, frameCount);
            break;
    }

    visualizeSimulation(result.frames, result.pageFaults, result.pageTableLog, result.diskLog);
});

// Simulate FIFO with page fault handling
function simulateFIFO(pages, frameCount) {
    let frames = []; // Physical memory frames
    let pageFaults = 0;
    let resultFrames = [];
    let pageTable = {}; // Simulate page table
    let disk = new Set(pages); // Simulate disk storage
    let pageTableLog = []; // Log page table state at each step
    let diskLog = []; // Log disk state at each step

    pages.forEach((page, index) => {
        if (!pageTable[page] || !pageTable[page].valid) {
            // Page fault: Page not in memory
            pageFaults++;
            if (frames.length < frameCount) {
                // Load page into memory
                frames.push(page);
                pageTable[page] = { valid: true, dirty: false };
                disk.delete(page); // Remove page from disk
            } else {
                // Replace the oldest page (FIFO)
                let replacedPage = frames.shift();
                pageTable[replacedPage].valid = false; // Mark replaced page as invalid
                if (pageTable[replacedPage].dirty) {
                    disk.add(replacedPage); // Write dirty page back to disk
                }
                frames.push(page);
                pageTable[page] = { valid: true, dirty: false };
                disk.delete(page); // Remove page from disk
            }
        } else {
            // Page is in memory, mark as accessed
            pageTable[page].dirty = true; // Simulate modification
        }
        resultFrames.push([...frames]);
        pageTableLog.push({ ...pageTable }); // Log page table state
        diskLog.push([...disk]); // Log disk state
    });

    return { frames: resultFrames, pageFaults, pageTableLog, diskLog };
}

// Simulate LRU with page fault handling
function simulateLRU(pages, frameCount) {
    let frames = [];
    let pageFaults = 0;
    let resultFrames = [];
    let pageTable = {};
    let disk = new Set(pages);
    let pageTableLog = [];
    let diskLog = [];
    let recent = []; // Track recently used pages

    pages.forEach((page, index) => {
        if (!pageTable[page] || !pageTable[page].valid) {
            // Page fault: Page not in memory
            pageFaults++;
            if (frames.length < frameCount) {
                frames.push(page);
                pageTable[page] = { valid: true, dirty: false };
                disk.delete(page);
            } else {
                // Replace the least recently used page
                let lru = recent.shift();
                let index = frames.indexOf(lru);
                pageTable[lru].valid = false; // Mark replaced page as invalid
                if (pageTable[lru].dirty) {
                    disk.add(lru); // Write dirty page back to disk
                }
                frames[index] = page;
                pageTable[page] = { valid: true, dirty: false };
                disk.delete(page); // Remove page from disk
            }
        } else {
            // Page is in memory, mark as accessed
            pageTable[page].dirty = true; // Simulate modification
        }
        recent.push(page); // Update recently used list
        resultFrames.push([...frames]);
        pageTableLog.push({ ...pageTable }); // Log page table state
        diskLog.push([...disk]); // Log disk state
    });

    return { frames: resultFrames, pageFaults, pageTableLog, diskLog };
}

// Simulate Optimal with page fault handling
function simulateOptimal(pages, frameCount) {
    let frames = [];
    let pageFaults = 0;
    let resultFrames = [];
    let pageTable = {};
    let disk = new Set(pages);
    let pageTableLog = [];
    let diskLog = [];

    pages.forEach((page, index) => {
        if (!pageTable[page] || !pageTable[page].valid) {
            // Page fault: Page not in memory
            pageFaults++;
            if (frames.length < frameCount) {
                frames.push(page);
                pageTable[page] = { valid: true, dirty: false };
                disk.delete(page);
            } else {
                // Replace the page that will not be used for the longest time
                let futureUse = frames.map(frame => pages.slice(index).indexOf(frame));
                let replaceIndex = futureUse.indexOf(-1) !== -1 ? futureUse.indexOf(-1) : futureUse.indexOf(Math.max(...futureUse));
                let replacedPage = frames[replaceIndex];
                pageTable[replacedPage].valid = false; // Mark replaced page as invalid
                if (pageTable[replacedPage].dirty) {
                    disk.add(replacedPage); // Write dirty page back to disk
                }
                frames[replaceIndex] = page;
                pageTable[page] = { valid: true, dirty: false };
                disk.delete(page);
            }
        } else {
            // Page is in memory, mark as accessed
            pageTable[page].dirty = true; // Simulate modification
        }
        resultFrames.push([...frames]);
        pageTableLog.push({ ...pageTable }); // Log page table state
        diskLog.push([...disk]); // Log disk state
    });

    return { frames: resultFrames, pageFaults, pageTableLog, diskLog };
}

// Simulate and animate visualization
function visualizeSimulation(frames, pageFaults, pageTableLog, diskLog) {
    let frameVisualization = document.getElementById('visualization');
    let pageTableVisualization = document.getElementById('pageTableVisualization');

    frameVisualization.innerHTML = '';
    pageTableVisualization.innerHTML = '';

    frames.forEach((frame, index) => {
        setTimeout(() => {
            // Visualize Frames (Left Section)
            let frameDiv = document.createElement('div');
            frameDiv.innerText = `Step ${index + 1}: ${frame.join(' | ')}`;
            frameVisualization.appendChild(frameDiv);

            // Visualize Page Table (Right Section)
            let pageTableDiv = document.createElement('div');
            pageTableDiv.innerHTML = `<strong>Page Table at Step ${index + 1}</strong><br>`;
            
            // Format and Display Page Table Properly
            let tableHTML = '<table border="1" style="width:100%; text-align:center;">';
            tableHTML += '<tr><th>Page</th><th>Valid</th><th>Dirty</th></tr>';
            for (let [page, entry] of Object.entries(pageTableLog[index])) {
                tableHTML += `<tr>
                                <td>${page}</td>
                                <td>${entry.valid ? 'Yes' : 'No'}</td>
                                <td>${entry.dirty ? 'Yes' : 'No'}</td>
                              </tr>`;
            }
            tableHTML += '</table>';

            pageTableDiv.innerHTML += tableHTML;
            pageTableVisualization.appendChild(pageTableDiv);

            // Display Disk State
            let diskDiv = document.createElement('div');
            diskDiv.innerHTML = `<strong>Disk at Step ${index + 1}</strong>: ${diskLog[index].join(', ') || 'Empty'}`;
            pageTableVisualization.appendChild(diskDiv);

            // Total Page Faults at the End
            // Total Page Faults at the End
     if (index === frames.length - 1) {
        let resultMessage = document.createElement('p');
        resultMessage.innerText = `Total Page Faults: ${pageFaults}`;
        resultMessage.style.fontWeight = 'bold';
        resultMessage.style.textAlign = 'left'; // Align to the left
        resultMessage.style.marginTop = '10px';
        resultMessage.style.marginLeft = '10px'; // Add some left margin
        frameVisualization.appendChild(resultMessage); // Append to the left section
    }
        }, index * 1000); // 1-second delay for step-by-step visualization
    });
}