const Poll = require("../models/Poll");
const Vote = require("../models/Vote");

function parsePollId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) return null;

  const normalized = options
    .map((option) => String(option).trim())
    .filter(Boolean);

  const uniqueOptions = [...new Set(normalized)];

  if (
    uniqueOptions.length < 2 ||
    uniqueOptions.length > 10 ||
    uniqueOptions.some((option) => option.length > 100)
  ) {
    return null;
  }

  return uniqueOptions;
}

function buildResults(poll, votes, userVote = null) {
  const counts = new Map();

  poll.options.forEach((option) => counts.set(option, 0));

  votes.forEach((vote) => {
    if (counts.has(vote.selected_option)) {
      counts.set(
        vote.selected_option,
        counts.get(vote.selected_option) + 1
      );
    }
  });

  const totalVotes = votes.length;

  return {
    pollId: poll.id,
    title: poll.title,
    targetLocation: poll.target_location,
    totalVotes,
    results: poll.options.map((option) => {
      const votesForOption = counts.get(option) || 0;

      return {
        option,
        votes: votesForOption,
        percentage:
          totalVotes === 0
            ? 0
            : Number(((votesForOption / totalVotes) * 100).toFixed(2))
      };
    }),
    userVoted: Boolean(userVote),
    selectedOption: userVote ? userVote.selected_option : null,
    updatedAt: new Date().toISOString()
  };
}

const createPoll = async (req, res) => {
  try {
    const { title, options, target_location } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Poll title is required" });
    }

    const normalizedOptions = normalizeOptions(options);

    if (!normalizedOptions) {
      return res.status(400).json({
        message: "A poll must contain 2 to 10 unique non-empty options"
      });
    }

    if (!target_location || !String(target_location).trim()) {
      return res.status(400).json({
        message: "Target location is required"
      });
    }

    const poll = await Poll.create({
      title: String(title).trim(),
      options: normalizedOptions,
      created_by: req.user.id,
      target_location: String(target_location).trim()
    });

    return res.status(201).json({
      message: "Poll created successfully",
      poll
    });
  } catch (error) {
    console.error("Create poll error:", error);
    return res.status(500).json({ message: "Failed to create poll" });
  }
};

const getPolls = async (req, res) => {
  try {
    const { target_location, created_by } = req.query;
    const filter = {};

    if (target_location) {
      filter.target_location = {
        $regex: String(target_location).trim(),
        $options: "i"
      };
    }

    if (created_by !== undefined) {
      const creatorId = Number(created_by);

      if (!Number.isInteger(creatorId) || creatorId <= 0) {
        return res.status(400).json({ message: "Invalid created_by value" });
      }

      filter.created_by = creatorId;
    }

    const polls = await Poll.find(filter).sort({ id: -1 }).lean();
    const pollIds = polls.map((poll) => poll.id);

    const votes = pollIds.length
      ? await Vote.find({ poll_id: { $in: pollIds } }).lean()
      : [];

    const voteCounts = new Map();

    votes.forEach((vote) => {
      voteCounts.set(
        vote.poll_id,
        (voteCounts.get(vote.poll_id) || 0) + 1
      );
    });

    const userVotes = new Set(
      votes
        .filter((vote) => req.user && vote.user_id === req.user.id)
        .map((vote) => vote.poll_id)
    );

    return res.status(200).json(
      polls.map((poll) => ({
        ...poll,
        totalVotes: voteCounts.get(poll.id) || 0,
        userVoted: userVotes.has(poll.id)
      }))
    );
  } catch (error) {
    console.error("Get polls error:", error);
    return res.status(500).json({ message: "Failed to fetch polls" });
  }
};

const getPollById = async (req, res) => {
  try {
    const pollId = parsePollId(req.params.id);

    if (!pollId) {
      return res.status(400).json({ message: "Invalid poll ID" });
    }

    const poll = await Poll.findOne({ id: pollId }).lean();

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const votes = await Vote.find({ poll_id: pollId }).lean();
    const userVote = req.user
      ? votes.find((vote) => vote.user_id === req.user.id)
      : null;

    return res.status(200).json({
      poll,
      results: buildResults(poll, votes, userVote)
    });
  } catch (error) {
    console.error("Get poll error:", error);
    return res.status(500).json({ message: "Failed to fetch poll" });
  }
};

const votePoll = async (req, res) => {
  try {
    const pollId = parsePollId(req.params.id);
    const { selected_option } = req.body;

    if (!pollId) {
      return res.status(400).json({ message: "Invalid poll ID" });
    }

    if (
      typeof selected_option !== "string" ||
      !selected_option.trim()
    ) {
      return res.status(400).json({
        message: "Selected option is required"
      });
    }

    const poll = await Poll.findOne({ id: pollId });

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const selectedOption = selected_option.trim();

    if (!poll.options.includes(selectedOption)) {
      return res.status(400).json({
        message: "Selected option is not valid for this poll"
      });
    }

    try {
      await Vote.create({
        poll_id: pollId,
        user_id: req.user.id,
        selected_option: selectedOption
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          message: "You have already voted in this poll"
        });
      }
      throw error;
    }

    const votes = await Vote.find({ poll_id: pollId }).lean();
    const userVote = req.user
      ? votes.find((vote) => vote.user_id === req.user.id)
      : null;

    return res.status(201).json({
      message: "Vote recorded successfully",
      results: buildResults(poll.toObject(), votes, userVote)
    });
  } catch (error) {
    console.error("Vote poll error:", error);
    return res.status(500).json({ message: "Failed to record vote" });
  }
};

const getPollResults = async (req, res) => {
  try {
    const pollId = parsePollId(req.params.id);

    if (!pollId) {
      return res.status(400).json({ message: "Invalid poll ID" });
    }

    const poll = await Poll.findOne({ id: pollId }).lean();

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const votes = await Vote.find({ poll_id: pollId }).lean();
    const userVote = req.user
      ? votes.find((vote) => vote.user_id === req.user.id)
      : null;

    return res.status(200).json(
      buildResults(poll, votes, userVote)
    );
  } catch (error) {
    console.error("Get poll results error:", error);
    return res.status(500).json({
      message: "Failed to fetch poll results"
    });
  }
};

const checkPollVote = async (req, res) => {
  try {
    const pollId = parsePollId(req.params.id);

    if (!pollId) {
      return res.status(400).json({ message: "Invalid poll ID" });
    }

    const vote = await Vote.findOne({
      poll_id: pollId,
      user_id: req.user.id
    }).lean();

    return res.status(200).json({
      voted: Boolean(vote),
      selectedOption: vote ? vote.selected_option : null
    });
  } catch (error) {
    console.error("Check poll vote error:", error);
    return res.status(500).json({
      message: "Failed to check vote status"
    });
  }
};

module.exports = {
  createPoll,
  getPolls,
  getPollById,
  votePoll,
  getPollResults,
  checkPollVote
};
