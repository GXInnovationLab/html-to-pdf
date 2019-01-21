let SS_HTML_TO_PDF = {
        clean_tags: ['img', 'hr', 'br', 'input', 'col ', 'embed', 'param', 'source', 'link'],
        fo_attributes_root: [
            'color',
            'height',
            'fontStyle', 'fontVariant', 'fontWeight', 'fontSize', 'fontFamily',
            'textAlign',
            'width'
        ],
        DEFAULTS : {
            pageWidth: "8.5in",
            pageHeight: "11in",
            pageMargin: ".50in"
        },
        fo_attributes: [
            'lineHeight',
            'alignmentBaseline',
            'backgroundImage', 'backgroundPosition', 'backgroundRepeat', 'backgroundColor',
            'baselineShift',
            'borderTopWidth', 'borderTopStyle', 'borderTopColor',
            'borderBottomWidth', 'borderBottomStyle', 'borderBottomColor',
            'borderLeftWidth', 'borderLeftStyle', 'borderLeftColor',
            'borderRightWidth', 'borderRightStyle', 'borderRightColor',
            'borderCollapse',
            'clear', 'color',
            'display', 'direction', 'dominantBaseline',
            'fill', 'float',
            'fontStyle', 'fontVariant', 'fontWeight', 'fontSize', 'fontFamily',
            'height',
            'listStyleType', 'listStyleImage',
            'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'orphans',
            'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'pageBreakAfter', 'pageBreakBefore',
            'stroke', 'strokeWidth',
            'strokeOpacity', 'fillOpacity',
            'tableLayout',
            'textAlign', 'textAnchor', 'textDecoration', 'textIndent', 'textTransform', 'textShadow',
            'verticalAlign',
            'widows', 'width',
            'position', 'top', 'left', 'bottom', 'right'
        ],
        getRealStyle: function (elm, attributes, pseudo) {
            var returnObj = {};
            var computed = getComputedStyle(elm, pseudo);
            for (var i = 0; i < attributes.length; i++) {
                returnObj[attributes[i]] = computed[attributes[i]];
            }
            return returnObj;
        },
        copyComputedStyle: function (elm, dest, parentStyle, attributes, pseudo) {
            parentStyle = parentStyle || {};
            var s = SS_HTML_TO_PDF.getRealStyle(elm, attributes, pseudo);

            for (var i in s) {
                var currentCss = s[i];

                // ignore duplicate "inheritable" properties
                if (parentStyle !== undefined && (parentStyle[i] && parentStyle[i] === currentCss)) {} else {
                    // The try is for setter only properties
                    try {
                        dest.style[i] = s[i];
                        // `fontSize` comes before `font` If `font` is empty, `fontSize` gets
                        // overwritten.  So make sure to reset this property. (hackyhackhack)
                        // Other properties may need similar treatment
                        if (i == "font") {
                            dest.style.fontSize = s.fontSize;
                        }
                    } catch (e) {}
                }
            }
        },
        setSVGHeightWidth: function (dest) {
            jQuery(dest).find('svg').each(function (index) {
                var svg = jQuery(this);
                svg.attr('height', svg.outerHeight());
                svg.attr('width', svg.outerWidth());
            });
        },
        replaceCanvas: function (dest) {
            jQuery(dest).find('canvas').each(function (index) {
                var canvas = this;
                var src_canvas = jQuery(jQuery(SS_HTML_TO_PDF.__elm)[0]).find('canvas')[index];
                jQuery('<img src="' + src_canvas.toDataURL() + '"/>').insertAfter(canvas);
            });
        },
        handlePseudoElem: function (dest) {
            jQuery(dest).find('*').each(function (index) {
                var elem = this;
                var before = getComputedStyle(elem, ':before');
                if (before.getPropertyValue('content').length > 0 && before.getPropertyValue('content') !=
                    "none") {
                    var before_text = before.getPropertyValue('content').split('"');
                    var in_image = false;
                    var processed = false;
                    var span_before = jQuery('<span>');
                    var parentStyle = SS_HTML_TO_PDF.getRealStyle(jQuery(elem).parent()[0],
                        SS_HTML_TO_PDF.fo_attributes, null);
                    SS_HTML_TO_PDF.copyComputedStyle(elem, span_before[0], parentStyle, SS_HTML_TO_PDF
                        .fo_attributes, ":before");
                    before_text.forEach(function (part) {
                        if (part == "")
                            processed = true;
                        if (part.indexOf("url(") >= 0) {
                            in_image = true;
                            processed = true;
                        }
                        if (part.indexOf("ttp://") >= 0 && in_image == true) {
                            var img = jQuery('<img src="url(&quot;' + part + '&quot;)">');
                            jQuery(span_before).append(img);
                            processed = true;
                        }
                        if (part.indexOf(")") >= 0 && in_image == true) {
                            in_image = false;
                            processed = true;
                        }
                        if (processed == false) {
                            var textspan = jQuery('<span>');
                            jQuery(textspan).text(part);
                            jQuery(span_before).append(textspan);
                        }
                        processed = false;
                    });
                    jQuery(elem).prepend(span_before);
                }
                var after = getComputedStyle(elem, ':after');
                if (after.getPropertyValue('content').length > 0 && after.getPropertyValue('content') !=
                    "none") {
                    var after_text = after.getPropertyValue('content').split('"');
                    var in_image = false;
                    var processed = false;
                    var span_after = jQuery('<span>');
                    var parentStyle = SS_HTML_TO_PDF.getRealStyle(jQuery(elem).parent()[0],
                        SS_HTML_TO_PDF.fo_attributes, null);
                    SS_HTML_TO_PDF.copyComputedStyle(elem, span_after[0], parentStyle, SS_HTML_TO_PDF
                        .fo_attributes, ":after");
                    after_text.forEach(function (part) {
                        if (part == "")
                            processed = true;
                        if (part.indexOf("url(") >= 0) {
                            in_image = true;
                            processed = true;
                        }
                        if (part.indexOf("ttp://") >= 0 && in_image == true) {
                            var img = jQuery('<img src="url(&quot;' + part + '&quot;)">');
                            jQuery(span_after).append(img);
                            processed = true;
                        }
                        if (part.indexOf(")") >= 0 && in_image == true) {
                            in_image = false;
                            processed = true;
                        }
                        if (processed == false) {
                            var textspan = jQuery('<span>');
                            jQuery(textspan).text(part);
                            jQuery(span_after).append(textspan);
                        }
                        processed = false;
                    });
                    jQuery(elem).append(span_after);
                }
            });
        },
        embedLocalImages: function (dest) {
            jQuery(dest).find('img').each(function (index) {
                var img = this;
                var imageUrl = img.src;
                if (imageUrl.indexOf(SS_HTML_TO_PDF.getBase()) != -1) {
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    canvas.height = img.height;
                    canvas.width = img.width;
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    var dataURL = canvas.toDataURL();
                    jQuery(img).attr('src', dataURL);
                    canvas = null;
                }
            });
        },
        computeTableCols: function (dest) {
            jQuery(dest).find('table').each(function () {
                var table = this;
                jQuery(table).find('col,colgroup').each(function () {
                    jQuery(this).attr('SS_HTML_TO_PDF-drop-me', true);
                });

                var cols = 0;
                jQuery(jQuery.find('dest td,th', jQuery('tr', table)[0])).each(function (td) {
                    cols += Number((Number(jQuery(td).attr('colspan'))) ? (jQuery(td).attr(
                        'colspan')) : 1);
                })
                var tbody = jQuery('<tbody>');
                var tr = jQuery('<tr>');
                jQuery(tbody).append(tr);

                for (var i = 0; i < cols; i++) {
                    jQuery(tr).append('<td style="padding:0; margin:0">&#x200b;</td>');
                }

                // append tbody after everything else
                jQuery(table).append(tbody);
                var widths = [];
                jQuery(jQuery(jQuery('tr', tbody)[0])).find('td,th').each(function () {
                    widths.push(jQuery(this).css('width').replace('px', ''));
                });

                // remove any original col groups and widths
                jQuery(table).find('[SS_HTML_TO_PDF-drop-me=true]').remove();
                jQuery(table).find('td,th').css('width', '');

                var colgroup = jQuery('<colgroup>');
                jQuery(table).prepend(colgroup);
                for (var i = 0; i < widths.length; i++) {
                    var col = jQuery('<col>');
                    jQuery(col).attr('width', widths[i]);
                    jQuery(colgroup).append(col);
                }
                jQuery(tbody).remove();
            });
        },
        cleanTags: function (PrintCopy) {
            var result = PrintCopy;
            for (var i = 0; i < SS_HTML_TO_PDF.clean_tags.length; i++) {
                var regx = new RegExp('(<' + SS_HTML_TO_PDF.clean_tags[i] + '("[^"]*"|[^\/">])*)>', 'g');
                result = result.replace(regx, '$1/>');
            }
            return result;
        },
        flattenStyle: function (elm, options) {
            // parent
            SS_HTML_TO_PDF.copyComputedStyle(elm, elm, undefined, SS_HTML_TO_PDF.fo_attributes_root,
                null);
            // children
            jQuery(elm).find('*').each(function (index, elm2) {
                switch (elm2.tagName) {
                    case 'IFRAME':
                        try {
                            // HACK! selector in iframe goes after [contenteditable] 
                            // this to become an optional sub-selector for content iframe somehow in future
                            var content = jQuery(jQuery(SS_HTML_TO_PDF.__elm).find('iframe[src="' +
                                jQuery(elm2).attr('src') + '"]')[0].contentDocument).find(
                                '[contenteditable]');
                            var iflat = jQuery('<div data-SS_HTML_TO_PDF-formatting=\'i-flat\'></div>');
                            iflat.html(content.html());
                            content.after(iflat);
                            SS_HTML_TO_PDF.flattenStyle(iflat[0]);
                            jQuery(elm2).after(iflat);

                        } catch (e) {}
                    case 'SCRIPT':
                        // ignore these tags
                        break;
                    default:
                        var parentStyle = SS_HTML_TO_PDF.getRealStyle(jQuery(elm2).parent()[0],SS_HTML_TO_PDF.fo_attributes, null);
                        SS_HTML_TO_PDF.copyComputedStyle(elm2, elm2, parentStyle, SS_HTML_TO_PDF.fo_attributes, null);
                        break;
                }
            });
            // Fix table columns
            SS_HTML_TO_PDF.computeTableCols(elm);
            // Check SVG width/height
            SS_HTML_TO_PDF.setSVGHeightWidth(elm);
            // Embed canvas
            SS_HTML_TO_PDF.replaceCanvas(elm);
            // Pseudo Elements (currently only handles :before and :after and can be turned off if needed)
            if (options.processPseudoElem == 'true')
                SS_HTML_TO_PDF.handlePseudoElem(elm);
            // Embed local image if set in options
            if (options.embedLocalImages == 'true') {
                SS_HTML_TO_PDF.embedLocalImages(elm);
            }
        },
        togglePrintMediaStyle: function () {
            if (jQuery('head style[data-SS_HTML_TO_PDF-formatting]').length > 0) {
                jQuery('head style[data-SS_HTML_TO_PDF-formatting]').remove();
                return;
            }
            var printrules = [];
            for (var x = 0; x < document.styleSheets.length; x++) {
                // ignore media print
                var skipMedia = false;
                for (var i = 0; i < SS_HTML_TO_PDF.MEDIA_IGNORE.length; i++) {
                    if (document.styleSheets[x].href && document.styleSheets[x].href.indexOf(SS_HTML_TO_PDF.MEDIA_IGNORE[
                            i]) > 0) {
                        skipMedia = true;
                        break;
                    }
                }


                // try catch - some browsers don't allow to read css stylesheets
                var rules;
                try {
                    if (!document.styleSheets[x].cssRules === null || (document.styleSheets[x].href !== null &&
                            document.styleSheets[x].href.indexOf(location.host) === 0)) {
                        skipMedia = true;
                    }
                    if (skipMedia) continue;
                    var rules = document.styleSheets[x].cssRules;
                } catch (e) {}

                if (rules) {
                    var rule = [];
                    for (var x2 = 0; x2 < rules.length; x2++) {

                        if (rules[x2].media && rules[x2].media && (rules[x2].media[0] === 'print' ||
                                rules[x2].media && rules[x2].media.mediaText === 'print')) {
                            for (var x3 = 0; x3 < rules[x2].cssRules.length; x3++) {
                                rule.push(rules[x2].cssRules[x3]);
                            }
                        } else if (rules[x2].parentStyleSheet.media[0] &&
                            rules[x2].parentStyleSheet.media[0] === 'print' ||
                            (rules[x2].parentStyleSheet.media &&
                                rules[x2].parentStyleSheet.media.mediaText === 'print')) {
                            rule.push(rules[x2]);
                        }
                    }
                    for (var x2 = 0; x2 < rule.length; x2++) {
                        printrules.push(rule[x2].cssText);
                    }
                }
            }

            // write print media styles to head
            var html = '\n<style type="text/css" data-SS_HTML_TO_PDF-formatting="true">\n';
            for (var x = 0; x < printrules.length; x++) {
                html += '.SS_HTML_TO_PDF-container ' + printrules[x] + '\n';
            }
            html += '</style>\n';
            jQuery('head').append(html);
        },
        getFOContainer: function (elm, options) {
            options = options || {};
            options.pageWidth = options.pageWidth || SS_HTML_TO_PDF.DEFAULTS.pageWidth;
            options.pageHeight = options.pageHeight || SS_HTML_TO_PDF.DEFAULTS.pageHeight;
            options.pageMargin = options.pageMargin || SS_HTML_TO_PDF.DEFAULTS.pageMargin;

            var container = jQuery('<div class=\'SS_HTML_TO_PDF-container\'></div>');
            var margincontainer = jQuery('<div class=\'margin-container\'></div>');
            if (options.srctype == 'svg') {
                var svgcontainer = jQuery('<div class=\'svg-container\' width=' + jQuery(elm).width() +
                    ' height=' + jQuery(elm).height() + '></div>');
                margincontainer.append(svgcontainer);
            }

            container.append(margincontainer);
            var stylebuilder = '';
            var stylebuildermargin = '';
            var fostylebuilder = '';

            stylebuilder += 'width: ' + options.pageWidth + '; ';
            stylebuilder += 'height: ' + options.pageHeight + '; ';
            stylebuildermargin += 'margin: ' + options.pageMargin + '; ';

            if (options && options.pageMarginTop) {
                stylebuildermargin += 'margin-top: ' + options.pageMarginTop + '; ';
            }
            if (options && options.pageMarginRight) {
                stylebuildermargin += 'margin-right: ' + options.pageMarginRight + '; ';
            }
            if (options && options.pageMarginBottom) {
                stylebuildermargin += 'margin-bottom: ' + options.pageMarginBottom + '; ';
            }
            if (options && options.pageMarginLeft) {
                stylebuildermargin += 'margin-left: ' + options.pageMarginLeft + '; ';
            }
            if (options && options.cssStyle) {
                jQuery.each(options.cssStyle, function (key, value) {
                    jQuery.each(value, function (objkey, objvalue) {
                        stylebuilder += objkey.fromCamel() + ': ' + objvalue + '; ';
                    });
                });
            }
            if (options && options.foStyle) {
                jQuery.each(options.foStyle, function (key, value) {
                    jQuery.each(value, function (objkey, objvalue) {
                        fostylebuilder += objkey.fromCamel() + ': ' + objvalue + '; ';
                    });
                });
            }
            container.attr('style', stylebuilder);
            margincontainer.attr('style', stylebuildermargin);
            container.attr('fostyle', fostylebuilder);
            return container;
        },
        getBase: function () {
            var pathname = jQuery(location).attr('pathname').substring(0, jQuery(location).attr('pathname').lastIndexOf(
                '/') + 1);
            var base = jQuery(location).attr('protocol') + '//' + jQuery(location).attr('hostname') + pathname;
            return base;
        },
        // IE Hack!
        cleanSVGDeclarations: function (data) {
            var builder = '';

            var regx = /<svg ("[^"]*"|[^\/">])*>/ig;
            var match = regx.exec(data);
            var startIdx = 0;
            var svgdec_text = 'xmlns="http://www.w3.org/2000/svg"';

            while (match != null) {

                builder = builder || '';
                builder += data.substring(startIdx, match.index);

                // hack for IE
                // build replacement opening svg tag, killing duplicate xmlns svg namespace decleration
                builder += '<svg';
                // add back name values
                var svgdec_flag = false;
                var namevalues = match[0].match(/([^< =,]*)=("[^"]*"|[^,"]*)/ig);
                for (var s = 0; s < namevalues.length; s++) {
                    if (namevalues[s] === svgdec_text && svgdec_flag) {} else {
                        builder += ' ' + namevalues[s];
                    }
                    svgdec_flag = namevalues[s] === svgdec_text || svgdec_flag;
                }
                builder += '>';

                data = data.substring(match.index + match[0].length);
                regx = /<svg ("[^"]*"|[^\/">])*>/ig;
                match = regx.exec(data);
            }

            return builder += (data || '');
        },
        xep_chandra_service_AS_PDF: '',

        xsl_stylesheet_declaration: '<?xml-stylesheet type="text/xsl" href="http://xep.cloudformatter.com/doc/XSL/SS_HTML_TO_PDF-fo-translate-2.xsl"?>',
        svg_xsl_stylesheet_declaration: '<?xml-stylesheet type="text/xsl" href="http://xep.cloudformatter.com/doc/XSL/SS_HTML_TO_PDF-svg-translate.xsl"?>',
        src_type: {
            xml: 'text/xml'
        },
        mime_type: {
            pdf: 'application/pdf',
            svg: 'image/svg+xml',
            xps: 'application/vnd.ms-xpsdocument',
            ps: 'application/postscript',
            afp: 'application/afp',
            xep: 'application/xep',
            png: 'image/png'
        },
        __format: function (ElementIDs, options) {
            options = options || {};
            options.render = (options.render === undefined) ? 'newwin' : options.render;
            options.mimeType = (options.mimeType === undefined) ? SS_HTML_TO_PDF.mime_type.pdf : options.mimeType;
            options.filename = (options.filename === undefined) ? 'document' : options.filename;
            options.resolution = (options.resolution === undefined) ? '120' : options.resolution;
            options.processPseudoElem = (options.processPseudoElem === undefined) ? 'true' : options.processPseudoElem;

            //Record the height of the target
            current_height = jQuery('#' + ElementIDs[0]).height();

            //Set the stylesheet to use
            current_stylesheet = options.srctype == 'svg' ? SS_HTML_TO_PDF.svg_xsl_stylesheet_declaration :
                SS_HTML_TO_PDF.xsl_stylesheet_declaration;

            var printcopy = '';
            jQuery(ElementIDs).each(function (index, ElementID) {
                SS_HTML_TO_PDF.__elm = jQuery('#' + ElementID)[0];
                if (!SS_HTML_TO_PDF.__elm) {
                    throw new Error('Missing or invalid selector');
                }

                SS_HTML_TO_PDF.__clone = jQuery(SS_HTML_TO_PDF.__elm)[0].outerHTML;
                SS_HTML_TO_PDF.__container = SS_HTML_TO_PDF.getFOContainer(SS_HTML_TO_PDF
                    .__elm, options);

                jQuery('#' + ElementID).after(jQuery(SS_HTML_TO_PDF.__container));
                jQuery(SS_HTML_TO_PDF.__clone).appendTo(jQuery(SS_HTML_TO_PDF.__container).children(
                    1));

                // SS_HTML_TO_PDF.togglePrintMediaStyle();
                SS_HTML_TO_PDF.flattenStyle(jQuery(SS_HTML_TO_PDF.__container)[0], options);
                printcopy = printcopy + SS_HTML_TO_PDF.cleanTags(jQuery(SS_HTML_TO_PDF.__container)[
                    0].outerHTML);
                SS_HTML_TO_PDF.Clear();
            });

            // fix IE double xmlns declerations in SVG
            // if (SS_HTML_TO_PDF.IE()) {
            //     printcopy = SS_HTML_TO_PDF.cleanSVGDeclarations(printcopy);
            // }
            //Kevin hack for now, stuff the whole thing in a document div
            var nss = "";
            jQuery.each(options.namespaces || [], function (objkey, objvalue) {
                nss += objvalue + ' ';
            });
            printcopy = '<div>' + printcopy + '</div>';

            var blob;
            // set temp mimetype for display
            current_mimetype = options.mimeType;
            if (options.render === 'download') {
                jQuery('body').append(
                    '<form name="test" style="width:0px; height:0px; overflow:hidden" enctype=\'multipart/form-data\' id=\'temp_post\' method=\'POST\' action=\'' +
                    SS_HTML_TO_PDF.xep_chandra_service_AS_PDF + '\'></form>');
                jQuery('#temp_post').append('<input type=\'hidden\' name=\'mimetype\' value=\'' + options.mimeType +
                    '\'/>');
                jQuery('#temp_post').append('<input type=\'hidden\' name=\'filename\' value=\'' + options.filename +
                    '\'/>');
                jQuery('#temp_post').append('<input type=\'hidden\' name=\'xml\' value=\'' + printcopy + '\'/>');
                jQuery('#temp_post').submit();
                jQuery('#temp_post').remove();

            }
            return false;
        },

        Format: function (ElementID, options) {
            var items;
            this.xep_chandra_service_AS_PDF = options.url
            if (jQuery.isArray(ElementID)) {
                items = ElementID;
            } else {
                items = [ElementID];
            }
            return SS_HTML_TO_PDF.__format(items, options);
        },

        Clear: function () {
            if (jQuery(SS_HTML_TO_PDF.__container).length === 0 ||
                jQuery(SS_HTML_TO_PDF.__container).attr('data-SS_HTML_TO_PDF-embed-pending') === 'true')
                return;

            jQuery(SS_HTML_TO_PDF.__container).remove();
            // SS_HTML_TO_PDF.togglePrintMediaStyle();
        },

    }
