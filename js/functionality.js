function sortStatuses() {
    // Sort statuses based on attribute
    var parent = document.querySelector(".statuses");
    var matches = document.querySelectorAll(".others");
    var grpNumbers = [];

    // Collect attribute values and sort them
    matches.forEach(function(userItem) {
        grpNumbers.push(userItem.getAttribute("data-groupNumber"));
    })
    grpNumbers.sort();

    // Regroup elements
    var elems = document.createDocumentFragment();
    grpNumbers.forEach(function(idx) {
        for(var i=0; i<matches.length; i++) {
            if(matches[i].getAttribute("data-groupNumber") == idx) {
                elems.appendChild(matches[i].cloneNode(true));
            }
        }
    });

    // Remove child elements and replace with sorted elements
    while(parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
    parent.appendChild(elems);
}
