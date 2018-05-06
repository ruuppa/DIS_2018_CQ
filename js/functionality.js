constHome = {
    EL_STATUSES: '.statuses',
    EL_OTHERS: '.others',
    EL_NICK_NAME: '.nickname',
    EL_NICK_COUNT: '.nickcount',
    ATTR_GRP_RANK: 'data-groupRank'
};

function sortStatuses() {
    // Sort statuses based on attribute
    var parent = document.querySelector(constHome.EL_STATUSES);
    var matches = document.querySelectorAll(constHome.EL_OTHERS);
    var grpNumbers = [];

    // Collect attribute values and sort them
    matches.forEach(function(userItem) {
        grpNumbers.push(userItem.getAttribute(constHome.ATTR_GRP_RANK));
    })
    // Sort and then reverse as reverse does not sort
    grpNumbers.sort();
    grpNumbers.reverse();
    // console.log(grpNumbers);

    // Regroup elements
    var elems = document.createDocumentFragment();
    grpNumbers.forEach(function(idx) {
        for(var i=0; i<matches.length; i++) {
            if(matches[i].getAttribute(constHome.ATTR_GRP_RANK) == idx) {
                console.log(matches[i].getAttribute(constHome.ATTR_GRP_RANK));
                elems.appendChild(matches[i].cloneNode(true));
            }
        }
    });

    // Remove child elements and replace with sorted elements
    // console.log('Removing')
    removeAllChilds(parent);
    // console.log('Adding')
    parent.appendChild(elems);
}

function addParticipants(data) {
    // Add participant list to home page
    var parent = document.querySelector(constHome.EL_STATUSES);

    var elems = document.createDocumentFragment();
    for(var i=0; i<data.length; i++) {
        var delems = data[i].split('|');

        var newNickContainer = document.createElement("div");
        var divCls = document.createAttribute("class");
        divCls.value = constHome.EL_OTHERS.slice(1);
        var divData = document.createAttribute(constHome.ATTR_GRP_RANK);
        divData.value = delems[1];
        newNickContainer.setAttributeNode(divCls);
        newNickContainer.setAttributeNode(divData);

        var newNick = document.createElement("span");
        var nickSpanCls = document.createAttribute("class");
        nickSpanCls.value = constHome.EL_NICK_NAME.slice(1);
        newNick.setAttributeNode(nickSpanCls);
        var newNickText = document.createTextNode(delems[0]);
        newNick.appendChild(newNickText);

        var newNickCount = document.createElement("span");
        var countSpanCls = document.createAttribute("class");
        countSpanCls.value = constHome.EL_NICK_COUNT.slice(1);
        newNickCount.setAttributeNode(countSpanCls);
        var newCountText = document.createTextNode(delems[1]);
        newNickCount.appendChild(newCountText);

        newNickContainer.appendChild(newNick);
        newNickContainer.appendChild(newNickCount);

        elems.appendChild(newNickContainer);
    }

    removeAllChilds(parent);
    parent.appendChild(elems);
}

function removeAllChilds(parent) {
    while(parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}
