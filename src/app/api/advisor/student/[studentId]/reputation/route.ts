import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Review } from '@/models/Review';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    await connectDB();
    const { studentId } = await params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch all employer_to_student reviews for this student
    const reviews = await Review.find({
      revieweeId: studentId,
      reviewType: 'employer_to_student',
      isPublic: true,
      isVerified: true,
    }).populate('reviewerId', 'name companyName');

    if (reviews.length === 0) {
      return NextResponse.json({
        success: true,
        aggregatedStats: null,
        recommendations: [],
      });
    }

    // Calculate aggregated statistics
    let totalProfessionalism = 0;
    let totalPunctuality = 0;
    let totalSkillPerformance = 0;
    let totalWorkQuality = 0;
    let professionalismCount = 0;
    let punctualityCount = 0;
    let skillPerformanceCount = 0;
    let workQualityCount = 0;
    let totalRecommendations = 0;

    const recommendations: {
      employerName: string;
      companyName: string;
      text: string;
      createdAt: Date;
    }[] = [];

    reviews.forEach((r) => {
      if (r.professionalismRating) {
        totalProfessionalism += r.professionalismRating;
        professionalismCount++;
      }
      if (r.punctualityRating) {
        totalPunctuality += r.punctualityRating;
        punctualityCount++;
      }
      if (r.skillPerformanceRating) {
        totalSkillPerformance += r.skillPerformanceRating;
        skillPerformanceCount++;
      }
      if (r.workQualityRating) {
        totalWorkQuality += r.workQualityRating;
        workQualityCount++;
      }

      if (r.isRecommended) {
        totalRecommendations++;
      }

      if (r.recommendationText) {
        recommendations.push({
          employerName: r.reviewerId?.name,
          companyName: r.reviewerId?.companyName,
          text: r.recommendationText,
          createdAt: r.createdAt,
        });
      }
    });

    const aggregatedStats = {
      averageProfessionalism: professionalismCount
        ? Number((totalProfessionalism / professionalismCount).toFixed(1))
        : 0,
      averagePunctuality: punctualityCount
        ? Number((totalPunctuality / punctualityCount).toFixed(1))
        : 0,
      averageSkillPerformance: skillPerformanceCount
        ? Number((totalSkillPerformance / skillPerformanceCount).toFixed(1))
        : 0,
      averageWorkQuality: workQualityCount
        ? Number((totalWorkQuality / workQualityCount).toFixed(1))
        : 0,
      totalReviews: reviews.length,
      totalRecommendations,
    };

    return NextResponse.json({
      success: true,
      aggregatedStats,
      recommendations,
    });
  } catch (error: unknown) {
    console.error('Fetch reputation aggregation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
