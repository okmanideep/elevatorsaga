{
    init: function(elevators, floors) {
        var isInBetween = function(a, b, i) {
            return (a-i)*(b-i) <= 0;
        };

        var getInertia = function(timeFactor, loadFactor) {
            return timeFactor*(5 + 1*loadFactor*loadFactor*loadFactor);
        };

        var getBestElevator = function(eles, floorNum, direction) {
            var best = eles[0];
            var minIntertia = getInertia(best.getTimeFactor(floorNum, direction), best.loadFactor());

            for(i = 1; i < eles.length; i++) {
                var e = eles[i];
                var inertia = getInertia(e.getTimeFactor(floorNum, direction), e.loadFactor());
                if(inertia < minIntertia) {
                    best = e;
                    minIntertia = inertia;
                }
            }

            return best;
        };

        elevators.forEach(function(e, index) {
            e.isDestination = function(floorNum) {
                return e.destinationQueue.indexOf(floorNum) != -1;
            };

            e.isPressed = function(floorNum) {
                return e.getPressedFloors().indexOf(floorNum) != -1;
            }

            e.getTimeFactor = function(floorNum, direction) {
                var queue = e.destinationQueue;
                var stops = 0;
                var covered = 0;
                var current = e.currentFloor();

                while(queue.length > 0 && !(current === floorNum)) {
                    var destination = queue[0];
                    if(isInBetween(current, destination, floorNum))
                        destination = floorNum;

                    covered += Math.abs(destination - current);
                    var finalQueue = queue.filter(function(f) { return !isInBetween(current, destination, f);});
                    stops += queue.length - finalQueue.length;

                    queue = finalQueue;
                    current = destination;
                }

                if(current != floorNum) {
                    covered += Math.abs(floorNum - current);
                }

                return covered + stops;
            };

            e.on("floor_button_pressed", function(floorNum) {
                if(!e.isDestination(floorNum)) {
                    e.goToFloor(floorNum);
                }
            });

            e.on("passing_floor", function(floorNum, direction) {
                if(e.loadFactor() < 1) {
                    if(e.isDestination(floorNum)) {
                        e.destinationQueue = e.destinationQueue.filter(function(n) { return n != floorNum;});
                        e.goToFloor(floorNum, true);
                        return;
                    }
                }
            });
        });

        floors.forEach(function(floor) {
            floor.on("up_button_pressed", function() {
                var best = getBestElevator(elevators, floor.floorNum(), "up");
                if(best.isDestination(floor.floorNum()))
                    return;
                else 
                    best.goToFloor(floor.floorNum());
                
            });

            floor.on("down_button_pressed", function() {
                var best = getBestElevator(elevators, floor.floorNum(), "down");
                if(best.isDestination(floor.floorNum()))
                    return;
                else
                    best.goToFloor(floor.floorNum());
            });
        });
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
