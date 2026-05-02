# Documentation on `user-marker.tsx` and user location polling using the `expo-location` API

## `user-marker.tsx:`
* takes a custom type `UserMarkerProps` that contains a coordinate object (longitude and latitude), and a string that contains a path to an image
    * later down the line, we will implement functionality for grabbing from the database to get a user's specific profile picture (somehow...)
* `UserMarker` is essentially just using a react-native-maps `Marker` component that we have styled over with both the pin shape and the 
* in `@/app/(app)/map/index.tsx`, we pass a coordinate object in to center the component on the real user coordinates
* for now, we are using a placeholder default .png for when a given one is not passed into the component
* we will later map the friends array across these new components whenever we can populate true friends rather than mock friends

## `expo-location API use:`
* functions that we are making use of:
    * requestForegroundPermissionAsync()
        * requests the user's device for location permissions.
    * getLastKnownPositionAsync()
        * grabs the user's last cached location
            * we are using this to prevent map buffering upon a new load 
    * getCurrentPositionAsync()
        * grabs the user's current location at the time of the function call
    * watchPositionAsync()
        * consistently polls for the user's location on certain conditions
            * conditions: 
            * we have moved 10 meters away from our last known location, or
            * 10 seconds have passed
* stuff we may use later from `expo-location`:
    * magnetometer, accelerometer, pedometer
