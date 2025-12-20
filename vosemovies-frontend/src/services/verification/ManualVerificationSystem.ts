import { VOSEShowtime, ScrapedShowtime } from '../../types/Cinema';

export interface VerificationTask {
  id: string;
  showtimeId?: string;
  movieTitle: string;
  cinemaName: string;
  startTime: Date;
  rawText: string;
  algorithmPrediction: {
    isVOSE: boolean;
    confidence: number;
    reasons: string[];
  };
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_review' | 'verified' | 'rejected' | 'expired';
  createdAt: Date;
  assignedTo?: string;
  verificationResult?: VerificationResult;
  notes?: string;
}

export interface VerificationResult {
  isVOSE: boolean;
  verifierConfidence: number; // 1-5 scale
  verifierNotes: string;
  verifiedAt: Date;
  verifiedBy: string;
  evidenceUrls?: string[]; // Screenshots or URLs as evidence
  correctionReason?: string; // If algorithm was wrong
}

export interface VerificationStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  algorithmAccuracy: number;
  topCorrectionReasons: { reason: string; count: number }[];
}

export class ManualVerificationSystem {
  private tasks: Map<string, VerificationTask> = new Map();
  private verificationHistory: VerificationResult[] = [];

  // Create verification tasks from scraped showtimes
  createVerificationTasks(showtimes: ScrapedShowtime[]): VerificationTask[] {
    const tasks: VerificationTask[] = [];

    showtimes.forEach((showtime, index) => {
      const priority = this.calculatePriority(showtime);

      // Only create tasks for uncertain predictions or new cinemas
      if (showtime.confidence < 0.8 || priority === 'high') {
        const task: VerificationTask = {
          id: `task_${Date.now()}_${index}`,
          movieTitle: showtime.movieTitle,
          cinemaName: showtime.cinemaName,
          startTime: showtime.startTime,
          rawText: showtime.rawText,
          algorithmPrediction: {
            isVOSE: showtime.isVOSE,
            confidence: showtime.confidence,
            reasons: [] // Would come from VOSE detector
          },
          priority,
          status: 'pending',
          createdAt: new Date()
        };

        this.tasks.set(task.id, task);
        tasks.push(task);
      }
    });

    return tasks;
  }

  // Calculate priority based on various factors
  private calculatePriority(showtime: ScrapedShowtime): 'high' | 'medium' | 'low' {
    let score = 0;

    // Low confidence predictions need high priority
    if (showtime.confidence < 0.4) score += 3;
    else if (showtime.confidence < 0.6) score += 2;
    else if (showtime.confidence < 0.8) score += 1;

    // New or unknown cinemas get high priority
    if (showtime.cinemaName === 'Unknown Cinema') score += 2;

    // Recent showtimes get higher priority
    const daysDiff = (Date.now() - showtime.scrapedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < 1) score += 1;

    // Complex raw text might need human review
    if (showtime.rawText.length > 200 ||
        showtime.rawText.includes('special') ||
        showtime.rawText.includes('festival')) {
      score += 1;
    }

    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  // Get tasks for verification (with filtering and sorting)
  getVerificationTasks(options: {
    status?: VerificationTask['status'];
    priority?: VerificationTask['priority'];
    assignedTo?: string;
    limit?: number;
    sortBy?: 'priority' | 'created' | 'confidence';
  } = {}): VerificationTask[] {
    let tasks = Array.from(this.tasks.values());

    // Apply filters
    if (options.status) {
      tasks = tasks.filter(task => task.status === options.status);
    }

    if (options.priority) {
      tasks = tasks.filter(task => task.priority === options.priority);
    }

    if (options.assignedTo) {
      tasks = tasks.filter(task => task.assignedTo === options.assignedTo);
    }

    // Sort tasks
    tasks.sort((a, b) => {
      switch (options.sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'confidence':
          return a.algorithmPrediction.confidence - b.algorithmPrediction.confidence;
        case 'created':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    // Apply limit
    if (options.limit) {
      tasks = tasks.slice(0, options.limit);
    }

    return tasks;
  }

  // Submit verification result
  async submitVerification(
    taskId: string,
    result: Omit<VerificationResult, 'verifiedAt'>
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const verificationResult: VerificationResult = {
      ...result,
      verifiedAt: new Date()
    };

    // Update task
    task.verificationResult = verificationResult;
    task.status = result.isVOSE !== undefined ? 'verified' : 'rejected';

    // Store in history for analytics
    this.verificationHistory.push(verificationResult);

    // If algorithm was wrong, this helps improve future predictions
    if (result.isVOSE !== task.algorithmPrediction.isVOSE) {
      await this.reportAlgorithmError(task, verificationResult);
    }
  }

  // Report algorithm errors for learning
  private async reportAlgorithmError(
    task: VerificationTask,
    result: VerificationResult
  ): Promise<void> {
    const errorReport = {
      originalPrediction: task.algorithmPrediction,
      correctAnswer: result.isVOSE,
      rawText: task.rawText,
      cinemaName: task.cinemaName,
      correctionReason: result.correctionReason,
      verifierNotes: result.verifierNotes,
      reportedAt: new Date()
    };

    // In a real implementation, this would be sent to a learning system
    console.log('[VerificationSystem] Algorithm error reported:', errorReport);

    // TODO: Implement feedback loop to improve VOSE detection algorithm
  }

  // Get verification statistics
  getVerificationStats(): VerificationStats {
    const tasks = Array.from(this.tasks.values());

    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const verified = tasks.filter(t => t.status === 'verified').length;
    const rejected = tasks.filter(t => t.status === 'rejected').length;

    // Calculate algorithm accuracy
    const verifiedTasks = tasks.filter(t => t.verificationResult);
    const correctPredictions = verifiedTasks.filter(t =>
      t.algorithmPrediction.isVOSE === t.verificationResult!.isVOSE
    ).length;

    const algorithmAccuracy = verifiedTasks.length > 0
      ? correctPredictions / verifiedTasks.length
      : 0;

    // Get top correction reasons
    const correctionReasons = verifiedTasks
      .filter(t => t.verificationResult!.correctionReason)
      .map(t => t.verificationResult!.correctionReason!);

    const reasonCounts = correctionReasons.reduce((acc, reason) => {
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCorrectionReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total,
      pending,
      verified,
      rejected,
      algorithmAccuracy,
      topCorrectionReasons
    };
  }

  // Assign tasks to verifiers
  assignTasks(
    verifierId: string,
    taskIds: string[]
  ): { assigned: string[]; failed: string[] } {
    const assigned: string[] = [];
    const failed: string[] = [];

    taskIds.forEach(taskId => {
      const task = this.tasks.get(taskId);
      if (task && task.status === 'pending') {
        task.assignedTo = verifierId;
        task.status = 'in_review';
        assigned.push(taskId);
      } else {
        failed.push(taskId);
      }
    });

    return { assigned, failed };
  }

  // Expire old tasks
  expireOldTasks(daysOld: number = 30): number {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    let expiredCount = 0;

    this.tasks.forEach((task, taskId) => {
      if (task.createdAt < cutoffDate && task.status === 'pending') {
        task.status = 'expired';
        expiredCount++;
      }
    });

    return expiredCount;
  }

  // Export tasks for external review (CSV format)
  exportTasks(tasks: VerificationTask[]): string {
    const headers = [
      'ID',
      'Movie Title',
      'Cinema',
      'Start Time',
      'Algorithm Prediction',
      'Confidence',
      'Raw Text',
      'Priority',
      'Status'
    ];

    const csvRows = [headers.join(',')];

    tasks.forEach(task => {
      const row = [
        task.id,
        `"${task.movieTitle}"`,
        `"${task.cinemaName}"`,
        task.startTime.toISOString(),
        task.algorithmPrediction.isVOSE.toString(),
        task.algorithmPrediction.confidence.toFixed(2),
        `"${task.rawText.replace(/"/g, '""')}"`,
        task.priority,
        task.status
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // Get task by ID
  getTask(taskId: string): VerificationTask | undefined {
    return this.tasks.get(taskId);
  }

  // Delete task
  deleteTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }

  // Bulk operations
  bulkUpdateStatus(taskIds: string[], status: VerificationTask['status']): number {
    let updated = 0;
    taskIds.forEach(taskId => {
      const task = this.tasks.get(taskId);
      if (task) {
        task.status = status;
        updated++;
      }
    });
    return updated;
  }
}