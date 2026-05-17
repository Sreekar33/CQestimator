import { FaceLandmarkerResult, DrawingUtils, FaceLandmarker } from '@mediapipe/tasks-vision';

export const drawLandmarks = (
	ctx: CanvasRenderingContext2D,
	result: FaceLandmarkerResult,
	videoElement: HTMLVideoElement
 ) => {
	const width = ctx.canvas.width;
	const height = ctx.canvas.height;

	ctx.save();
	ctx.clearRect(0, 0, width, height);

	ctx.drawImage(videoElement, 0, 0, width, height);

	
	if(result.faceLandmarks && result.faceLandmarks.length>0){
		const drawingUtils = new DrawingUtils(ctx);

		for(const landmarks of result.faceLandmarks){
			//Face mesh
			drawingUtils.drawConnectors(
				landmarks,
				FaceLandmarker.FACE_LANDMARKS_TESSELATION,
				{ color: '#C0C0C030', lineWidth: 1}
			)

			// Right eye
			drawingUtils.drawConnectors(
				landmarks,
				FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
				{ color: '#FF3030', lineWidth: 1}
			)

			// Left eye
			drawingUtils.drawConnectors(
				landmarks,
				FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
				{ color: '#30FF30', lineWidth: 1}
			)
			
			// Face Oval
			drawingUtils.drawConnectors(
				landmarks,
				FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
				{ color: '#30FF30', lineWidth: 1}
			)

			// Face Oval
			drawingUtils.drawConnectors(
				landmarks,
				FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
				{ color: '#30FF30', lineWidth: 1}
			)

		}
	}

	ctx.restore();
};