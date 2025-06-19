export interface ObjectCoverDisplayProperties {
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Calculate how the video fits within its container with object-fit: cover
 * @param videoElement - The video element to calculate the display properties for
 * @returns The display properties for the video element
 */
export function calculateObjectCoverDisplayProperties(
  videoElement: HTMLVideoElement,
): ObjectCoverDisplayProperties {
  const containerRect = videoElement.getBoundingClientRect();
  const { videoWidth, videoHeight } = videoElement;

  if (!videoWidth || !videoHeight)
    throw new Error("Video element must have a width and height");

  // Calculate how the video fits within its container with object-fit: cover
  const containerAspectRatio =
    containerRect.width / containerRect.height;
  const videoAspectRatio = videoWidth / videoHeight;

  let displayWidth, displayHeight, offsetX, offsetY;

  if (videoAspectRatio > containerAspectRatio) {
    // Video is wider than container - fit to height, crop width
    displayHeight = containerRect.height;
    displayWidth = (videoWidth * containerRect.height) / videoHeight;
    offsetX = (displayWidth - containerRect.width) / 2;
    offsetY = 0;
  } else {
    // Video is taller than container - fit to width, crop height
    displayWidth = containerRect.width;
    displayHeight = (videoHeight * containerRect.width) / videoWidth;
    offsetX = 0;
    offsetY = (displayHeight - containerRect.height) / 2;
  }

  return {
    displayWidth,
    displayHeight,
    offsetX,
    offsetY,
  };
}
