export const groupMarkets = (markets) => {
  const grouped = {};
  const result = [];
  
  markets.forEach(m => {
    const match = m.question.match(/^\[GROUP:(.+?)\] (.*)$/);
    if (match) {
      const groupId = match[1];
      if (!grouped[groupId]) {
        grouped[groupId] = {
          isGroup: true,
          id: groupId,
          title: groupId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          category: m.category,
          image_url: m.image_url,
          options: []
        };
        result.push(grouped[groupId]);
      }
      grouped[groupId].options.push({
        ...m,
        optionName: match[2]
      });
    } else {
      result.push({ isGroup: false, ...m });
    }
  });
  
  result.forEach(item => {
    if (item.isGroup) {
      item.options.sort((a, b) => b.yes - a.yes);
    }
  });
  
  return result;
};

export const calculateSmoothedPercentages = (yesVotes, noVotes, smoothingFactor = 10) => {
  const smoothedYes = (yesVotes || 0) + smoothingFactor;
  const smoothedNo = (noVotes || 0) + smoothingFactor;
  const totalSmoothed = smoothedYes + smoothedNo;
  
  const yes = Math.round((smoothedYes / totalSmoothed) * 100);
  const no = 100 - yes;
  
  return { yes, no, totalVotes: (yesVotes || 0) + (noVotes || 0) };
};
