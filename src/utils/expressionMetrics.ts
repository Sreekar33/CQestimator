import { Classifications } from '@mediapipe/tasks-vision';

export interface ExpressionMetrics{
    smile: number;
    eyeContact: number;
    eyeOpenness: number;
    expressiveness: number;
    headPose: {
        lookingDown: boolean;
        lookingAway: boolean;
    }
}

export function computeExpressionMetrics(
    blendshapes: Classifications[]
): ExpressionMetrics | null {
    if (!blendshapes || blendshapes.length ===0 ){
        return null;
    }

    const categories = blendshapes[0].categories;
    if(!categories || categories.length === 0){
        return null;
    }

    const scores: Record<string, number> = {};
    for (const cat of categories){
        scores[cat.categoryName] = cat.score
    }

    const smileLeft = scores['mouthSmileLeft'] ?? 0;
    const smileRight = scores['mouthSmileRight'] ?? 0;

    const smile = (smileLeft + smileRight)/2;

    const eyeLookInLeft = scores['eyeLookInLeft'] ?? 0;
    const eyeLookInRight = scores['eyeLookInRight'] ?? 0;
    const eyeLookOutLeft = scores['eyeLookOutLeft'] ?? 0;
    const eyeLookOutRight = scores['eyeLookOutRight'] ?? 0;
    const eyeLookUpLeft = scores['eyeLookUpLeft'] ?? 0;
    const eyeLookUpRight = scores['eyeLookUpRight'] ?? 0;
    const eyeLookDownLeft = scores['eyeLookDownLeft'] ?? 0;
    const eyeLookDownRight = scores['eyeLookDownRight'] ?? 0;

    const gazeDeviation = (
        eyeLookInLeft
        + eyeLookInRight
        + eyeLookOutLeft
        + eyeLookOutRight
        + eyeLookUpLeft
        + eyeLookUpRight
        + eyeLookDownLeft
        + eyeLookDownRight   
    )/8

    //inverse of gaze is eyecontact
    const eyeContact = Math.max(0, Math.min(1, 1 - gazeDeviation *2.5));

    const blinkLeft = scores['eyeBlinkLeft'] ?? 0;
    const blinkRight = scores['eyeBlinkRight'] ?? 0;
    const eyeOpenness = 1 - (blinkLeft + blinkRight) /2;

    const allScores = categories.map(c => c.score)
    const mean = allScores.reduce((a,b) => a + b, 0) / allScores.length;
    const variance = allScores.reduce((sum,s) => sum+ (s-mean) ** 2, 0) / allScores.length;
    const stdDev = Math.sqrt(variance)

    const expressiveness = Math.min(1, stdDev / 0.12);

    const lookingDown = (eyeLookDownLeft + eyeLookDownRight)/2 >0.4;
    const lookingAway = (eyeLookInLeft + eyeLookInRight + eyeLookOutLeft + eyeLookOutRight)/4 > 0.35;

    return {
        smile,
        eyeContact,
        eyeOpenness,
        expressiveness,
        headPose: {
            lookingDown,
            lookingAway
        }
    }




}
