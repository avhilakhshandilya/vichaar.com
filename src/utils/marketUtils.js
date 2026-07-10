export const groupMarkets = (markets) => {
  const grouped = {};
  const result = [];
  
  markets.forEach(m => {
    const match = m.question.match(/^\[GROUP:(.+?)\] (.*)$/);
    if (match) {
      const groupId = match[1];
      if (!grouped[groupId]) {
        let rawTitle = groupId;
        if (rawTitle.toLowerCase().startsWith('breaking-')) {
          rawTitle = rawTitle.slice(9);
        }
        let formattedTitle = rawTitle;
        if (!rawTitle.includes(' ') && rawTitle.includes('-')) {
           formattedTitle = rawTitle.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        } else {
           formattedTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
        }

        grouped[groupId] = {
          isGroup: true,
          id: groupId,
          title: formattedTitle,
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
    if (item.isGroup && item.options.length > 0) {
      // Find the common prefix among all option names in the group
      let commonPrefix = item.options[0].optionName;
      for (let i = 1; i < item.options.length; i++) {
        let j = 0;
        while (
          j < commonPrefix.length && 
          j < item.options[i].optionName.length && 
          commonPrefix[j] === item.options[i].optionName[j]
        ) {
          j++;
        }
        commonPrefix = commonPrefix.substring(0, j);
      }
      
      // If a meaningful common prefix exists (more than 10 chars), use it as the title
      if (commonPrefix.length > 10) {
        // Clean up trailing spaces or punctuation from the title
        item.title = commonPrefix.replace(/(\s+by\s*|\s*by\s*$|\s+at\s*$|[\s?]+$)/i, '').trim() + '?';
        
        // Strip the common prefix from each option to leave just the date/variable part
        item.options = item.options.map(opt => {
          let shortName = opt.optionName.substring(commonPrefix.length).trim();
          if (shortName.endsWith('?')) shortName = shortName.slice(0, -1);
          // Capitalize first letter of shortName
          if (shortName.length > 0) {
            shortName = shortName.charAt(0).toUpperCase() + shortName.slice(1);
          }
          return { ...opt, name: shortName || opt.optionName };
        });
      } else {
        // Fallback: just use optionName as name if no common prefix
        item.options = item.options.map(opt => ({ ...opt, name: opt.optionName }));
      }

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

export const getTrueVolume = (houseYes, houseNo) => {
  const total = (houseYes || 0) + (houseNo || 0);
  // All seeders use 10000 base liquidity, except Breaking which uses 0.
  // If total is >= 10000, we subtract the 10000 base liquidity to get true user volume.
  if (total >= 10000) return total - 10000;
  return total;
};
