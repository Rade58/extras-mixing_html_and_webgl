# Extra Workshops: Mixing HTML and WebGL

Going to create one HTML point and add the other ones at the end

We will define that if we hover on certain point of the elemnt a text shows up with a description of the part of the elemnt

look at `src/index.html` and `src/global.css` to see what I have done

# To hide show html element that is behind our model we will use Raycaster

We are going to use a Raycaster and shoot a ray from the camera to the point
• If there is no intersecting object, we show the point
• If there is something, we test the distance of the intersection
• If the intersection point is further than the point, it means the object is behind the point, and we can show it
• If the intersection point is closer than the point, the intersecting object is in front of the point, and we hide it
