explorerIgRds = (function () {
  "use strict";

  var nvl = function nvl(value1, value2) {
    if (value1 == null || value1 == "")
      return value2;
    return value1;
  };

  var changeReportSelector = '.a-Toolbar-selectList[data-action="change-report"]';

  var eventgridpagechange = function eventgridpagechange(daThis) {

    // Elements
    var regionId = daThis.action.affectedRegionId;

    // Interactive Grid
    var widget = apex.region(regionId).widget();
    var grid = widget.interactiveGrid('getViews', 'grid');
    var model = grid.model;
    var rdsContentID = "igRdsContent_" + regionId + "_RDS";

    $('#' + rdsContentID + "_CONTAINER").replaceWith();

    // Transpile the below
    //  https://babeljs.io/repl
    //  $('#' + regionId).find('.a-IG').before(`
    //  <div id="` + rdsContentID + `_CONTAINER" class="apex-tabs-region js-apex-region igrds-apex-tabs-region">
    //  <div class="apex-rds-container igrds-apex-rds-container"></div>
    //    <ul id="` + rdsContentID + `" class="apex-rds a-Tabs igrds-apex-rds" role="tablist" style="white-space: nowrap; overflow-x: hidden;">
    //    </ul>
    //  </div> 
    //  `);

    $('#' + regionId).find('.a-IG').before("\n     <div id=\"" + rdsContentID + "_CONTAINER\" class=\"apex-tabs-region js-apex-region igrds-apex-tabs-region\">\n     <div class=\"apex-rds-container igrds-apex-rds-container\"></div>\n       <ul id=\"" + rdsContentID + "\" class=\"apex-rds a-Tabs igrds-apex-rds\" role=\"tablist\" style=\"white-space: nowrap; overflow-x: hidden;\">\n       </ul>\n     </div> \n     ");

    // Insert the Tabs inside the Template
    setIGRDSContent(daThis);
  }

  var scrollRDStoActiveTab = function scrollRDStoActiveTab(pThis) {
    var gStaticID = pThis.action.affectedRegionId;
    var tab = $('#igRdsContent_' + gStaticID + '_RDS');
    var tabActive = $(tab).find('.apex-rds-selected');
    var tabActivePosition = $(tabActive).position();
    var scrollOffset = 16;

    // only scroll in to view if exists in tab i.e. when private report selected but private reports not shown
    if (typeof tabActivePosition != 'undefined') {
      if (tabActivePosition.left > $(tab).width() || tabActivePosition.left <= 0) {
        // scroll left, refetch and scroll to recalculated position and offset by 16 to accomodate chevrons
        $(tab).scrollLeft(0, 0);
        $(tab).scrollLeft($(tabActive).position().left - scrollOffset, 0);
      }
    }
  }

  var render = function render() {

    var rThis = this;
    var regionId = rThis.action.affectedRegionId;
    var debugPrefix = 'Explorer IGRDS Plugin: ';

    // Debug Info
    apex.debug.info(debugPrefix + 'Render ' + regionId);

    // Check this is an IG
    if ($('#' + regionId + ' .a-IG').length == 0) {
      apex.debug.info(debugPrefix + 'Error: Region ' + regionId + ' is not an Interactive Grid');
      return;
    }

    // Check we have a report select list
    if ($('#' + regionId + ' ' + changeReportSelector).length == 0) {
      apex.debug.info(debugPrefix + 'Error: The IG select list is required to be present on region ' + regionId);
      return;
    }

    // Use a matches polyfill for IE9+
    if (!Element.prototype.matches) {
      Element.prototype.matches = Element.prototype.msMatchesSelector ||
        Element.prototype.webkitMatchesSelector;
    };

    // mutation subscriber sets IGRDS content
    var mutationObserver = new MutationObserver(function (mutations) {
      // Look for potentially change-report related mutations in JS as JQuery itself causes a mutation
      var mutationSelector = changeReportSelector;
      if (mutations[0].target.matches(mutationSelector) ||
        mutations[0].target.querySelectorAll(mutationSelector).length > 0) {
        // mutation is potentially change-report related
        setIGRDSContent(rThis);
        scrollRDStoActiveTab(rThis);
      }
    });

    // mutation observer checking tooolbar for mutations. 
    // we are unable to place observer on the change report select list as extending the toolbar removes the observer
    mutationObserver.observe($("#" + regionId + "_ig_toolbar")[0], {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true
    });

    // Set up RDS Container and Tabs
    eventgridpagechange(rThis);
    // set session storage once, just to guarantee slider is initially in sync
    sessionStorage.setItem('.' + apex.item("pFlowId").getValue() + '.' + apex.item("pFlowStepId").getValue() + '.igRdsContent_' + regionId + '_RDS_CONTAINER.activeTab', 'javascript:void(' + getCurrentReportId(regionId) + ')');
    apex.widget.regionDisplaySelector("igRdsContent_" + regionId, { "useSlider": true, "mode": "standard" });

    // interactivegridviewchange is used to 
    // 1. sync up the RDS in case the change process is interupted e.g a 'changes to save' dialog displaying  
    // 2. Remove the apex_disabled class of IG Report after a delay which gives this IG a chance to catchup
    $('#' + regionId).on('interactivegridviewchange', function (event, data) {

      // pause for 100, then check if spinner has gone every 100
      setTimeout(function () {
        var spinngerInterval = setInterval(function () {
          var spinning = $('.u-Processing').length;
          if (spinning == 0) {
            clearInterval(spinngerInterval);
            $("#igRdsContent_" + regionId + "_RDS").removeClass('apex_disabled');
          }
        }, 100);
      }, 300);

      // Calling setIGRDSContent jumpts the slider around on the first click, therefore just reassign the active tab and scroll to it
      $("#igRdsContent_" + regionId + '_RDS' + ' .apex-rds-selected').removeClass('apex-rds-selected');
      $('#rRep' + getCurrentReportId(regionId)).addClass('apex-rds-selected');
      // reaffirmSelected
      reaffirmSelected("igRdsContent_" + regionId + '_RDS',
        apex.region(regionId).call("getReports"),
        getCurrentReportId(regionId));
      scrollRDStoActiveTab(rThis);
    });

    // Find the change report select list, hide the parent group if nothing else in the group, else just hide the select list
    if (rThis.action.attribute02 == 'Y') {
      var reportSelectList = $("#" + regionId).find(changeReportSelector);
      if (reportSelectList.length > 0) {
        var reportSelectListChildrenCount = $(reportSelectList).parent().children().length;
        if (reportSelectListChildrenCount == 1) {
          // Attempt to hide the entire group
          // Find index of the select list containing group within other toolbar groups
          var indexToolbarGroup = reportSelectList.closest('.a-Toolbar-groupContainer').children().index(reportSelectList.closest('.a-Toolbar-group')) + 1;
          //  inject the style for the select list containing group
          injectStyles('#' + regionId + ' .a-Toolbar-group:nth-of-type(' + indexToolbarGroup + ') { display: none !important; }');
        } else if (reportSelectListChildrenCount > 1) {
          // attempt to hide the select list. May leave toolbar padding
          injectStyles('#' + regionId + ' ' + changeReportSelector + ' { display: none !important; }');
        }
      }
    }
  };

  var getCurrentReportId = function getCurrentReportId(pIgStaticId) {

    var retReportId;
    try {
      var grid = apex.region(pIgStaticId).call('getViews', 'grid');
      var model = grid.model;
      if (model) {
        retReportId = apex.region(pIgStaticId).call("getViews").grid.model.getOption("regionData").reportId;
      } else {
        // Model obviously not exists, possibly a chart view, therefore default to the select list if possible
        retReportId = $("#" + pIgStaticId).find(changeReportSelector)[0].value;
      }
    }
    catch (err) {
      retReportId = $("#" + pIgStaticId).find(changeReportSelector)[0].value;
    }

    return retReportId;
  };

  var setIGRDSContent = function setIGRDSContent(pDaThis) {
    var igStaticId = pDaThis.action.affectedRegionId;
    var pIgRds = "igRdsContent_" + igStaticId + "_RDS";
    var pIncludePrivateReports = pDaThis.action.attribute01;
    var r = apex.region(igStaticId).call("getReports");
    var isCurrent = "";

    // Get current report
    isCurrent = getCurrentReportId(igStaticId);

    $("#" + pIgRds).empty();
    r.forEach(function (element, i) {

      var rName = nvl(element.name, "Primary Report");
      var isSelected = "",
        isFirst = "",
        styleAttr = "",
        rdsItemTab = "";

      if (isCurrent == element.id) {
        isSelected = "apex-rds-selected";
      }

      if (i == 0) {
        isFirst = "apex-rds-first";
      } else {
        isFirst = "apex-rds-after";
        if (i == r.length) {
          isFirst = "apex-rds-last apex-rds-after";
        }
      }

      // Escape the HTML, no reason to get it to render.
      rName = apex.util.escapeHTML(rName);

      // Exlcuded Private Reports have to in the RDS else has syncing issues when slider instantiated
      if ((element.type == "private" && pIncludePrivateReports == 'N')) {
        styleAttr = ' style="display:none;" ';
      } else {
        styleAttr = '';
      }

      rdsItemTab = ("<li class=\"apex-rds-item igrds-apex-rds-item " + isFirst + " " + isSelected + "\"" + styleAttr + " role=\"presentation\" " +
        "id=\"rRep" + element.id + "\"> " +
        "<a href=\"javascript:void(" + element.id + ")\"  " +
        "role=\"tab\" " +
        "aria-controls=\"igrds\" aria-selected=\"true\"> " +
        "<span class=\"igrds-apex-rds-item-type-" + element.type + "\">" + rName + "</span></a>" +
        "</li>");

      // Set content
      if ((element.type == "private" && pIncludePrivateReports == 'N')) {
        // If Private reports are hidden then add private report tabs to the front of the RDS to stop the slider slipping to the RDS end on page load
        $("#" + pIgRds).prepend(rdsItemTab);
      } else {
        // Append reports in IG report order
        $("#" + pIgRds).append(rdsItemTab);
      }

      // Bind click events so we can pass the object around
      $('#rRep' + element.id).find('a').unbind('click');
      $('#rRep' + element.id).find('a').bind('click', function (event) {
        rdsChangeReport(pDaThis, element.id);
      });

    });

    //  Adding add a spacer due to an APEX RDS right chevron bug - this prevents the right chevron overlapping shorter labels on the final tab
    $("#" + pIgRds).append('<li style="width:32px"></li>');

    // reaffirmSelected
    reaffirmSelected(pIgRds, r, isCurrent);

  };

  var reaffirmSelected = function reaffirmSelected(pIgRds, pGetReportsObj, pCurrentReport) {

    // Under some circumstances we cannot guarantee the (1) current report (2) current report is list of reports (3) No RDS item selected
    // The Primary Report can even change in IG under some circumstances
    // Therefore use the primary report as a fallback
    // no current report detected or current report is not an actual report, either way a -1 is returned
    if (pGetReportsObj.map(function (e) {
      return e.id;
    }).indexOf(pCurrentReport) == -1 ||
      $("#" + pIgRds + " .igrds-apex-rds-item.apex-rds-selected").length == 0
    ) {
      // situation where an invalid/no current report detected; This is potentially when...
      // 1. IG loads not on the grid view (e.g chart) is displayed first with no alternate/private reports. 
      // 2. Last report is deleted, leaving only the Primary Report
      // Therefore set the Primary Report as selected
      $("#" + pIgRds + " .igrds-apex-rds-item").filter(function () {
        return $(this).find('.igrds-apex-rds-item-type-primary').length != 0;
      }).addClass("apex-rds-selected");
    }
  }

  var rdsChangeReport = function rdsChangeReport(pDaThis, pReportId) {
    var pIgStaticId = pDaThis.action.affectedRegionId;
    var grid = apex.region(pIgStaticId).call('getViews', 'grid');
    var model = grid.model;
    var currentReportId = getCurrentReportId(pIgStaticId);

    // Only change if actual change required & destination report is in list of reports (!)
    if (nvl(currentReportId, pReportId) != pReportId &&  // Has the reprot changed, or if we dont know what report we are then probably we are on the primary
      apex.region(pIgStaticId).call("getReports").length != 1 &&  // Only 1 report? must be primary.. no reason to change then
      apex.region(pIgStaticId).call("getReports").map(function (e) { // Check the report we think we want to change to is in the list of reports
        return e.id;
      }).indexOf(pReportId) != -1) {
      // Only do this if the model has not changes else APEX gives a warning message
      if (!model || !model.isChanged()) {
        // We have to disable the RDS becasuse the user can click faster that the IG can change and produce errors
        $('#' + "igRdsContent_" + pIgStaticId + "_RDS").addClass('apex_disabled');
      }
      // Change Report
      apex.region(pIgStaticId).widget().interactiveGrid("getActions").set("change-report", pReportId);
    }
  };

  // https://css-tricks.com/snippets/javascript/inject-new-css-rules/
  function injectStyles(rule) {
    var div = $("<div />", {
      html: '&shy;<style>' + rule + '</style>'
    }).appendTo("body");
  }

  // Public functions
  return ({
    render: render
  });

}());