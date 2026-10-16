const Petition = require("../models/Petition");
const Signature = require("../models/Signature");
const GovernanceResponse = require("../models/GovernanceResponse");
const Poll = require("../models/Poll");
const Vote = require("../models/Vote");


/*
=========================================================
GET MONTH RANGE
=========================================================
*/

function getMonthRange(month, year) {
  const numericMonth = Number(month);
  const numericYear = Number(year);

  if (
    !Number.isInteger(numericMonth) ||
    numericMonth < 1 ||
    numericMonth > 12
  ) {
    return null;
  }

  if (
    !Number.isInteger(numericYear) ||
    numericYear < 2000 ||
    numericYear > 2100
  ) {
    return null;
  }

  const start = new Date(
    Date.UTC(
      numericYear,
      numericMonth - 1,
      1
    )
  );

  const end = new Date(
    Date.UTC(
      numericYear,
      numericMonth,
      1
    )
  );

  return {
    start,
    end,
    month: numericMonth,
    year: numericYear
  };
}


/*
=========================================================
MONTHLY CIVIC ENGAGEMENT REPORT
=========================================================
*/

const getMonthlyReport = async (req, res) => {
  try {
    const now = new Date();

    const month =
      req.query.month ||
      now.getUTCMonth() + 1;

    const year =
      req.query.year ||
      now.getUTCFullYear();

    const range = getMonthRange(
      month,
      year
    );

    if (!range) {
      return res.status(400).json({
        message: "Invalid month or year"
      });
    }

    const {
      start,
      end
    } = range;


    /*
    =====================================================
    PETITIONS
    =====================================================
    */

    const petitions =
      await Petition.find({
        createdAt: {
          $gte: start,
          $lt: end
        }
      })
        .sort({ id: 1 })
        .lean();


    /*
    =====================================================
    SIGNATURES
    =====================================================
    */

    const signatures = await Signature.find({
      timestamp: {
        $gte: start,
        $lt: end
      }
    }).lean();


    /*
    Signature counts by petition
    */

    const signatureMap = new Map();

    signatures.forEach(
      signature => {
        signatureMap.set(
          signature.petition_id,
          (signatureMap.get(
            signature.petition_id
          ) || 0) + 1
        );
      }
    );


    /*
    =====================================================
    GOVERNANCE RESPONSES
    =====================================================
    */

    const responses =
      await GovernanceResponse.find({
        createdAt: {
          $gte: start,
          $lt: end
        }
      })
        .sort({ createdAt: 1 })
        .lean();


    /*
    =====================================================
    POLLS
    =====================================================
    */

    const polls =
      await Poll.find({
        createdAt: {
          $gte: start,
          $lt: end
        }
      })
        .sort({ id: 1 })
        .lean();


    const pollIds =
      polls.map(
        poll => poll.id
      );


    /*
    =====================================================
    VOTES
    =====================================================
    */

    const votes =
      pollIds.length
        ? await Vote.find({
          poll_id: {
            $in: pollIds
          },
          createdAt: {
            $gte: start,
            $lt: end
          }
        }).lean()
        : [];


    /*
    =====================================================
    PETITION STATUS STATISTICS
    =====================================================
    */

    const petitionStatus = {
      active: 0,
      under_review: 0,
      closed: 0
    };

    petitions.forEach(
      petition => {
        if (
          Object.prototype.hasOwnProperty.call(
            petitionStatus,
            petition.status
          )
        ) {
          petitionStatus[
            petition.status
          ]++;
        }
      }
    );


    /*
    =====================================================
    CATEGORY STATISTICS
    =====================================================
    */

    const categoryMap = {};

    petitions.forEach(
      petition => {
        const category =
          petition.category ||
          "Uncategorized";

        categoryMap[category] =
          (categoryMap[category] || 0) + 1;
      }
    );


    /*
    =====================================================
    LOCATION STATISTICS
    =====================================================
    */

    const locationMap = {};

    petitions.forEach(
      petition => {
        const location =
          petition.location ||
          "Unknown";

        locationMap[location] =
          (locationMap[location] || 0) + 1;
      }
    );


    /*
    =====================================================
    PETITION DETAILS
    =====================================================
    */

    const petitionDetails =
      petitions.map(
        petition => ({
          id: petition.id,
          title: petition.title,
          category: petition.category,
          location: petition.location,
          status: petition.status,

          signatureLimit:
            petition.signatureLimit || 0,

          signatureCount:
            signatureMap.get(
              petition.id
            ) || 0,

          createdAt:
            petition.createdAt || null
        })
      );


    /*
    =====================================================
    RESPONSE STATISTICS
    =====================================================
    */

    const respondedPetitionIds =
      new Set(
        responses.map(
          response =>
            response.petition_id
        )
      );


    /*
    =====================================================
    FINAL REPORT
    =====================================================
    */

    return res.status(200).json({
      message:
        "Monthly civic engagement report generated successfully",

      report: {
        month: range.month,
        year: range.year,

        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },


        /*
        PETITION ENGAGEMENT
        */

        petitions: {
          totalCreated:
            petitions.length,

          byStatus:
            petitionStatus,

          byCategory:
            categoryMap,

          byLocation:
            locationMap,

          details:
            petitionDetails
        },


        /*
        SIGNATURE ENGAGEMENT
        */

        signatures: {
          total:
            signatures.length,

          uniqueUsers:
            new Set(
              signatures.map(
                signature =>
                  signature.user_id
              )
            ).size
        },


        /*
        GOVERNANCE
        */

        governance: {
          totalResponses:
            responses.length,

          petitionsRespondedTo:
            respondedPetitionIds.size
        },


        /*
        POLLING
        */

        polling: {
          pollsCreated:
            polls.length,

          votesRecorded:
            votes.length
        },


        /*
        OVERALL CIVIC ENGAGEMENT
        */

        engagement: {
          totalPetitions:
            petitions.length,

          totalSignatures:
            signatures.length,

          totalPolls:
            polls.length,

          totalPollVotes:
            votes.length,

          totalGovernanceResponses:
            responses.length
        }
      }
    });

  } catch (error) {
    console.error(
      "Monthly report error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to generate monthly report",

      error:
        error.message
    });
  }
};


/*
=========================================================
EXPORT MONTHLY REPORT AS CSV
=========================================================
*/

const exportMonthlyReport = async (req, res) => {
  try {
    const now = new Date();

    const month =
      req.query.month ||
      now.getUTCMonth() + 1;

    const year =
      req.query.year ||
      now.getUTCFullYear();

    const range = getMonthRange(
      month,
      year
    );

    if (!range) {
      return res.status(400).json({
        message:
          "Invalid month or year"
      });
    }


    /*
    =====================================================
    FETCH DATA
    =====================================================
    */

    const petitions =
      await Petition.find({
        createdAt: {
          $gte: range.start,
          $lt: range.end
        }
      })
        .sort({ createdAt: 1 })
        .lean();


    const signatures = await Signature.find({
      timestamp: {
        $gte: range.start,
        $lt: range.end
      }
    }).lean();


    const responses =
      await GovernanceResponse.find({
        createdAt: {
          $gte: range.start,
          $lt: range.end
        }
      })
        .sort({ createdAt: 1 })
        .lean();


    const polls =
      await Poll.find({
        createdAt: {
          $gte: range.start,
          $lt: range.end
        }
      })
        .sort({ createdAt: 1 })
        .lean();


    const pollIds =
      polls.map(
        poll => poll.id
      );


    const votes =
      pollIds.length
        ? await Vote.find({
          poll_id: {
            $in: pollIds
          },
          createdAt: {
            $gte: range.start,
            $lt: range.end
          }
        }).lean()
        : [];


    /*
    =====================================================
    CSV ROWS
    =====================================================
    */

    const rows = [];


    /*
    SUMMARY
    */

    rows.push([
      "CIVIX MONTHLY CIVIC ENGAGEMENT REPORT"
    ]);

    rows.push([
      "Month",
      `${range.year}-${String(
        range.month
      ).padStart(2, "0")}`
    ]);

    rows.push([]);


    rows.push([
      "Metric",
      "Value"
    ]);

    rows.push([
      "Petitions Created",
      petitions.length
    ]);

    rows.push([
      "Signatures",
      signatures.length
    ]);

    rows.push([
      "Governance Responses",
      responses.length
    ]);

    rows.push([
      "Polls Created",
      polls.length
    ]);

    rows.push([
      "Poll Votes",
      votes.length
    ]);

    rows.push([]);


    /*
    PETITION DETAILS
    */

    rows.push([
      "PETITION DETAILS"
    ]);

    rows.push([
      "Petition ID",
      "Title",
      "Category",
      "Location",
      "Status",
      "Signature Limit",
      "Signature Count",
      "Created At"
    ]);


    const signatureMap = new Map();

    signatures.forEach(
      signature => {
        signatureMap.set(
          signature.petition_id,
          (signatureMap.get(
            signature.petition_id
          ) || 0) + 1
        );
      }
    );


    petitions.forEach(
      petition => {
        rows.push([
          petition.id,
          petition.title,
          petition.category,
          petition.location,
          petition.status,
          petition.signatureLimit || 0,
          signatureMap.get(
            petition.id
          ) || 0,
          petition.createdAt
            ? new Date(
              petition.createdAt
            ).toISOString()
            : ""
        ]);
      }
    );


    rows.push([]);


    /*
    GOVERNANCE RESPONSES
    */

    rows.push([
      "GOVERNANCE RESPONSES"
    ]);

    rows.push([
      "Response ID",
      "Petition ID",
      "Official ID",
      "Status",
      "Comment",
      "Created At"
    ]);


    responses.forEach(
      response => {
        rows.push([
          response.id,
          response.petition_id,
          response.official_id,
          response.status,
          response.comment,
          response.createdAt
            ? new Date(
              response.createdAt
            ).toISOString()
            : ""
        ]);
      }
    );


    /*
    =====================================================
    CONVERT TO CSV
    =====================================================
    */

    const csv =
      rows
        .map(row =>
          row
            .map(value => {
              if (
                value === undefined ||
                value === null
              ) {
                return "";
              }

              const stringValue =
                String(value);

              return `"${stringValue.replace(
                /"/g,
                '""'
              )}"`;
            })
            .join(",")
        )
        .join("\n");


    const filename =
      `civix-report-${range.year}-${String(
        range.month
      ).padStart(2, "0")}.csv`;


    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );


    return res
      .status(200)
      .send(csv);

  } catch (error) {
    console.error(
      "Export report error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to export report",

      error:
        error.message
    });
  }
};


module.exports = {
  getMonthlyReport,
  exportMonthlyReport
};