
let intersections = [];
let possibleIntersections = [];
let streets = {};
let data;

onLoad();
async function onLoad() {
  data = await fetch('https://data.calgary.ca/resource/k7p9-kppz.json').then(res => res.json());
  //todo: sort data by street name
  console.log(data);
  data.forEach((item, i) => {
    //creating dom element for each camera + adding to intersections object
    let url = item.camera_url.url;
    let streetA = item.camera_location.split(' / ')[0];
    let streetB = item.camera_location.split(' / ')[1];
    if(streetB == undefined) {
      streetB = streetA; //2 of them don't have a /
    }
    let index = i;
    let domElement = document.createElement('div');
    domElement.classList.add('cam');
    domElement.id = 'cam-' + index;
    domElement.innerHTML = `
    <img src="${url}" />
    <h3>${streetA} / ${streetB}</h3>
    `;
    document.getElementById('cam-container').appendChild(domElement);
    let intersection = {
      streetA: streetA,
      streetB: streetB,
      domElement: domElement,
      index: index,
      url: url,
    };
    intersections.push(intersection);

    //creating 'chips' for each street + adding to streets object
    if (!streets[streetA]) {
      let domChip = generateChip(streetA);
      //document.getElementById('street-chips').appendChild(domChip);

      let street = {
        name: streetA,
        domChip: domChip,
        intersections: [],
        getIntersections: function() {
          return this.intersections;
        }
      };
      streets[streetA] = street;
    }
    //Same as above, but for streetB
    if (!streets[streetB]) {   
      let domChip = generateChip(streetB);

      let street = {
        name: streetB,
        domChip: domChip,
        intersections: [],
        getIntersections: function() {
          return this.intersections;
        }
      };
      streets[streetB] = street;
    }
    
  });
  
  //Adds all intersections to each street
  for (let intersection of intersections) {
    streets[intersection.streetA].intersections.push(intersection);
    streets[intersection.streetB].intersections.push(intersection);
  }
  
  //Adds all chips to the dom in alphabetical order
  let chips = [];
  for (let street in streets) {
    chips.push(streets[street].domChip);
  }
  chips.sort((a, b) => {
    return a.firstChild.innerHTML.localeCompare(b.firstChild.innerHTML);
  });
  chips.forEach(chip => {
    document.getElementById('street-chips').appendChild(chip);
  });


  //Event listeners for expanding / collapsing the street chips
  let chipContainer = document.getElementById('street-chips');
  chipContainer.addEventListener('click', (e) => {
    if(!chipContainer.classList.contains('compact')) {
        chipContainer.classList.add('compact');
        chipContainer.classList.remove('expanded');
    }
    else {
      chipContainer.classList.add('expanded');
      chipContainer.classList.remove('compact');
    }
  });
  //Display all intersections if no streets selected instead of none
  possibleIntersections = intersections;

  //Begin loop to update images
  reloadImages();

}

function chipClick(street) {
  //switch for the number of chips selected before the click
  switch (document.getElementsByClassName('selected').length) {
    case 0: //No chips selected, select the clicked chip
      //deselect all first
      for(let i=0; i<document.getElementsByClassName('chip').length; i++) {
        document.getElementsByClassName('chip')[i].classList.remove('selected');
        document.getElementsByClassName('chip')[i].classList.add('inactive');
      }
      //remove inactive from all intersections between the selected chip and all other chips
      for(let i=0; i<streets[street].getIntersections().length; i++) {
        streets[streets[street].getIntersections()[i].streetA].domChip.classList.remove('inactive');
        streets[streets[street].getIntersections()[i].streetB].domChip.classList.remove('inactive');
      }
      //select the clicked chip
      streets[street].domChip.classList.add('selected');
      streets[street].domChip.classList.remove('inactive');

      //update possible intersections list
      possibleIntersections = streets[street].getIntersections();
      break;
    case 1:
      //if the only selected chip is clicked again, deselect it
      if(streets[street].domChip.classList.contains('selected')) {
        for(let i=0; i<document.getElementsByClassName('chip').length; i++) {
          document.getElementsByClassName('chip')[i].classList.remove('inactive');
          document.getElementsByClassName('chip')[i].classList.remove('selected');
        }
      //Show all intersections as last chip was deselected
      possibleIntersections = intersections;
        
      }//if a different chip is clicked, select it
      else {
        //deselect all chips
        for(let i=0; i<document.getElementsByClassName('chip').length; i++) {
          if(!document.getElementsByClassName('chip')[i].classList.contains('selected')){
            document.getElementsByClassName('chip')[i].classList.add('inactive');
          }
        }
        //select the clicked chip
        streets[street].domChip.classList.add('selected');
        streets[street].domChip.classList.remove('inactive');
        //find all intersections that are between the two selected chips
        let firstChip = document.getElementsByClassName('selected')[0] == streets[street].domChip ? document.getElementsByClassName('selected')[1] : document.getElementsByClassName('selected')[0];
        let firstChipIntersections = streets[firstChip.children[0].innerHTML].getIntersections();
        let secondChipIntersections = streets[street].getIntersections();
        //get overlapping intersections
        possibleIntersections = [];
        for(let i=0; i<firstChipIntersections.length; i++) {
          for(let j=0; j<secondChipIntersections.length; j++) {
            if(firstChipIntersections[i].index == secondChipIntersections[j].index) {
              possibleIntersections.push(firstChipIntersections[i]);
            }
          }
        }
      }
      break;

    case 2://if a selected chip is clicked again and it is not the only selection, deselect it
      if(streets[street].domChip.classList.contains('selected')) {
        let firstChip = //finds the second selected chip (the one that is not the one clicked)
          document.getElementsByClassName('selected')[0] == streets[street].domChip
            ? document.getElementsByClassName('selected')[1]
            : document.getElementsByClassName('selected')[0];
        //gets the street of the chip from its child h3
        let firstChipName = firstChip.children[0].innerHTML;
        //deselect all chips (should prob extract this into a function)
        for(let i=0; i<document.getElementsByClassName('chip').length; i++) {
          document.getElementsByClassName('chip')[i].classList.add('inactive');
          document.getElementsByClassName('chip')[i].classList.remove('selected');
        }
        //remove inactive from all intersections between the selected chip and all other chips
        for(let i=0; i<streets[firstChipName].getIntersections().length; i++) {
          streets[streets[firstChipName].getIntersections()[i].streetA].domChip.classList.remove('inactive');
          streets[streets[firstChipName].getIntersections()[i].streetB].domChip.classList.remove('inactive');
        }
        //reselect the first chip
        firstChip.classList.add('selected');

        //update possible intersections list
        possibleIntersections = 
          document.getElementsByClassName('selected')[0].children[0].innerHTML == street
            ? streets[document.getElementsByClassName('selected')[1].children[0].innerHTML].getIntersections()
            : streets[document.getElementsByClassName('selected')[0].children[0].innerHTML].getIntersections();
      }
      //no else as that would be selected a third chip which is not allowed
      break;
    default:
      //something went wrong
      console.log('error, too many chips selected');
      break;
  }

  //updates which intersections are shown
  for(let i=0; i<intersections.length; i++) {
    intersections[i].domElement.classList.add('inactive');
  }
  for(let i=0; i<possibleIntersections.length; i++) {
    possibleIntersections[i].domElement.classList.remove('inactive');
  }

  //change chips to compact mode if any are selected and expanded mode if none are selected
  let selectedCount = document.getElementsByClassName('selected').length;
  if(selectedCount == 0) {
    document.getElementById('street-chips').classList.add('expanded');
    document.getElementById('street-chips').classList.remove('compact');
  } else {
    document.getElementById('street-chips').classList.remove('expanded');
    document.getElementById('street-chips').classList.add('compact');
  }

}

//creates a new chip dom element
function generateChip(street) {
  let chip = document.createElement('div');
  chip.innerHTML = `<h3>${street}</h3>`;
  chip.classList.add('chip');
  chip.addEventListener('click', (e) => {
    e.stopPropagation();
    chipClick(street);
  });

  return chip;
}

//loop every second and retrieves one image at a time from API 
//(near current updates if focused on one or a few intersections but equally efficeint if all are shown)
async function reloadImages(i = 0) {
  //makeshift for loop
  if(i>=possibleIntersections.length) i = 0;

  let intersection = possibleIntersections[i];
  
  let imageURL = intersection.url;
  await fetch(imageURL, {cache: 'reload', mode: 'no-cors'});//I found this online to force the image to reload,
  //otherwise it would just reuse the cached version and never actually update

  intersection.domElement.children[0].src = imageURL;

  i++;

  setTimeout(() => {
    reloadImages(i);
  }, 1000);
  
}