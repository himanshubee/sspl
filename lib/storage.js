import { getPool } from "./mysql";

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Buffer.isBuffer(value)) {
    try {
      const parsed = JSON.parse(value.toString("utf-8"));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (typeof value === "object") {
    return Array.isArray(value) ? value : [];
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapSubmissionRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : row.created_at,
    name: row.name,
    address: row.address,
    playerType: row.player_type,
    playerTypeOther: row.player_type_other ?? "",
    tshirtSize: row.tshirt_size,
    jerseyName: row.jersey_name,
    jerseyNumber: row.jersey_number,
    foodType: row.food_type,
    foodTypeOther: row.food_type_other ?? "",
    photoKey: row.photo_key,
    photoContentType: row.photo_content_type,
    paymentScreenshotKey: row.payment_screenshot_key,
    paymentContentType: row.payment_content_type,
    ocrText: row.ocr_text ?? "",
    ocrPaymentDetected: row.ocr_payment_detected ?? null,
    ocrCandidateAmounts: normalizeArray(row.ocr_candidate_amounts),
    ocrValidationReasons: normalizeArray(row.ocr_validation_reasons),
    ocrMatchedAmount: row.ocr_matched_amount,
    failureReason: row.failure_reason ?? null,
    failureMessage: row.failure_message ?? null,
    paymentValidated: Boolean(row.payment_validated),
    deleted: Boolean(row.deleted),
  };
}

export async function readSubmissions() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
      id,
      created_at,
      name,
      address,
      player_type,
      player_type_other,
      tshirt_size,
      jersey_name,
      jersey_number,
      food_type,
      food_type_other,
      photo_key,
      photo_content_type,
      payment_screenshot_key,
      payment_content_type,
      ocr_text,
      ocr_payment_detected,
      ocr_candidate_amounts,
      ocr_validation_reasons,
      ocr_matched_amount,
      payment_validated,
      deleted
    FROM submissions
    WHERE deleted = 0
    ORDER BY created_at DESC`,
  );

  return rows.map(mapSubmissionRow);
}

export async function addSubmission(submission) {
  try {
    const pool = getPool();
    await pool.execute(
      `INSERT INTO submissions (
        id,
        created_at,
        name,
        address,
        player_type,
        player_type_other,
        tshirt_size,
        jersey_name,
        jersey_number,
        food_type,
        food_type_other,
        photo_key,
        photo_content_type,
        payment_screenshot_key,
        payment_content_type,
        ocr_text,
        ocr_payment_detected,
        ocr_candidate_amounts,
        ocr_validation_reasons,
        ocr_matched_amount,
        payment_validated,
        deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        submission.id,
        new Date(submission.createdAt),
        submission.name,
        submission.address,
        submission.playerType,
        submission.playerTypeOther || null,
        submission.tshirtSize,
        submission.jerseyName,
        submission.jerseyNumber,
        submission.foodType,
        submission.foodTypeOther || null,
        submission.photoKey || null,
        submission.photoContentType || null,
        submission.paymentScreenshotKey || null,
        submission.paymentContentType || null,
        submission.ocrText || null,
        submission.ocrPaymentDetected ?? null,
        JSON.stringify(submission.ocrCandidateAmounts ?? []),
        JSON.stringify(submission.ocrValidationReasons ?? []),
        submission.ocrMatchedAmount ?? null,
        submission.paymentValidated ? 1 : 0,
        0,
      ],
    );
  } catch (error) {
    console.error("[Storage] Failed to add submission.", error);
    throw error;
  }
}

export async function readFailedSubmissions() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
      id,
      created_at,
      name,
      address,
      player_type,
      player_type_other,
      tshirt_size,
      jersey_name,
      jersey_number,
      food_type,
      food_type_other,
      photo_key,
      photo_content_type,
      payment_screenshot_key,
      payment_content_type,
      ocr_text,
      ocr_payment_detected,
      ocr_candidate_amounts,
      ocr_validation_reasons,
      ocr_matched_amount,
      deleted
    FROM failed_submissions
    WHERE deleted = 0
    ORDER BY created_at DESC`,
  );

  return rows.map(mapSubmissionRow);
}

export async function addFailedSubmission(submission) {
  try {
    const pool = getPool();
    await pool.execute(
      `INSERT INTO failed_submissions (
        id,
        created_at,
        name,
        address,
        player_type,
        player_type_other,
        tshirt_size,
        jersey_name,
        jersey_number,
        food_type,
        food_type_other,
        photo_key,
        photo_content_type,
        payment_screenshot_key,
        payment_content_type,
        ocr_text,
        ocr_payment_detected,
        ocr_candidate_amounts,
        ocr_validation_reasons,
        ocr_matched_amount,
        deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        submission.id,
        new Date(submission.createdAt),
        submission.name,
        submission.address,
        submission.playerType,
        submission.playerTypeOther || null,
        submission.tshirtSize,
        submission.jerseyName,
        submission.jerseyNumber,
        submission.foodType,
        submission.foodTypeOther || null,
        submission.photoKey || null,
        submission.photoContentType || null,
        submission.paymentScreenshotKey || null,
        submission.paymentContentType || null,
        submission.ocrText || null,
        submission.ocrPaymentDetected ?? null,
        JSON.stringify(submission.ocrCandidateAmounts ?? []),
        JSON.stringify(submission.ocrValidationReasons ?? []),
        submission.ocrMatchedAmount ?? null,
        0
      ],
    );
  } catch (error) {
    console.error("[Storage] Failed to add failed submission.", error);
    throw error;
  }
}

export async function approveFailedSubmission(id) {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT
        id,
        created_at,
        name,
        address,
        player_type,
        player_type_other,
        tshirt_size,
        jersey_name,
        jersey_number,
        food_type,
        food_type_other,
        photo_key,
        photo_content_type,
        payment_screenshot_key,
        payment_content_type,
        ocr_text,
        ocr_payment_detected,
        ocr_candidate_amounts,
        ocr_validation_reasons,
        ocr_matched_amount
      FROM failed_submissions
      WHERE id = ?
      FOR UPDATE`,
      [id],
    );

    if (rows.length === 0) {
      await connection.rollback();
      return null;
    }

    const mapped = mapSubmissionRow(rows[0]);
    const createdAt = mapped.createdAt
      ? new Date(mapped.createdAt)
      : new Date();

    await connection.execute(
      `INSERT INTO submissions (
        id,
        created_at,
        name,
        address,
        player_type,
        player_type_other,
        tshirt_size,
        jersey_name,
        jersey_number,
        food_type,
        food_type_other,
        photo_key,
        photo_content_type,
        payment_screenshot_key,
        payment_content_type,
        ocr_text,
        ocr_payment_detected,
        ocr_candidate_amounts,
        ocr_validation_reasons,
        ocr_matched_amount,
        payment_validated,
        deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mapped.id,
        createdAt,
        mapped.name,
        mapped.address,
        mapped.playerType,
        mapped.playerTypeOther || null,
        mapped.tshirtSize,
        mapped.jerseyName,
        mapped.jerseyNumber,
        mapped.foodType,
        mapped.foodTypeOther || null,
        mapped.photoKey || null,
        mapped.photoContentType || null,
        mapped.paymentScreenshotKey || null,
        mapped.paymentContentType || null,
        mapped.ocrText || null,
        mapped.ocrPaymentDetected ?? null,
        JSON.stringify(mapped.ocrCandidateAmounts ?? []),
        JSON.stringify(mapped.ocrValidationReasons ?? []),
        mapped.ocrMatchedAmount ?? null,
        0,
        0,
      ],
    );

    await connection.execute(
      "UPDATE failed_submissions SET deleted = 1 WHERE id = ?",
      [id],
    );

    await connection.commit();
    return mapped;
  } catch (error) {
    console.error("[Storage] Failed to approve submission.", error);
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("[Storage] Failed to rollback approve transaction.", rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteSubmission(id) {
  const pool = getPool();
  try {
    const [result] = await pool.execute(
      "UPDATE submissions SET deleted = 1 WHERE id = ?",
      [id],
    );
    return result?.affectedRows > 0;
  } catch (error) {
    console.error("[Storage] Failed to delete submission.", error);
    throw error;
  }
}

export async function countActiveSubmissions() {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS total FROM submissions WHERE deleted = 0",
  );
  const count = rows?.[0]?.total ?? 0;
  return Number.parseInt(count, 10) || 0;
}

export async function updateSubmissionPaymentValidation(id, validated) {
  const pool = getPool();
  try {
    const [result] = await pool.execute(
      "UPDATE submissions SET payment_validated = ? WHERE id = ? AND deleted = 0",
      [validated ? 1 : 0, id],
    );
    if (!result?.affectedRows) {
      return null;
    }
    const [rows] = await pool.query(
      `SELECT
        id,
        created_at,
        name,
        address,
        player_type,
        player_type_other,
        tshirt_size,
        jersey_name,
        jersey_number,
        food_type,
        food_type_other,
        photo_key,
        photo_content_type,
        payment_screenshot_key,
        payment_content_type,
        ocr_text,
        ocr_payment_detected,
        ocr_candidate_amounts,
        ocr_validation_reasons,
        ocr_matched_amount,
        payment_validated,
        deleted
      FROM submissions
      WHERE id = ?
      LIMIT 1`,
      [id],
    );
    if (!rows.length) {
      return null;
    }
    return mapSubmissionRow(rows[0]);
  } catch (error) {
    console.error("[Storage] Failed to update payment validation.", error);
    throw error;
  }
}
