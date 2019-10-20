# IG-Report-Display-Selector-Plugin

IG Report Display Selector APEX Plugin

<img src="https://raw.githubusercontent.com/ExplorerUK/IG-Report-Display-Selector-Plugin/master/preview.gif" width="700px">

## Demo
https://apex.oracle.com/pls/apex/f?p=145466

## Release History
19.1 Initial Version

## How to install
Download this repository and import the plug-in into your application from this location:

`src/dynamic_action_plugin_com_uk_explorer_igrds.sql`

Additionally you can put the JavaScript & CSS on your web server for better performance.

## Features
* Report Display Selector (RDS) syncs with editable and Non-editable Interactive Grids (IG)
* Click on a Report in the RDS and the IG changes to that report
* Click on a Report in the IG and the RDS changes to that report
* RDS tab focussed on Page Load to whatever Report the user used
* Setting: Enable Private Reports to be displayed (default disabled)
* Setting: Hide in in-built Interactive Grid Reports Selector (default disabled)
* RDS set to scroll if it exceeds the width of the Interactive Grid & scrolls the RDS to the correct tab
* RDS has custom classes for custom styling of the specific report, i.e specific classes for primary, alternate & private
* Hides & Shows with the Region with the show/hide Dynamic Actions and all IG Templates e.g Collapsible Regions
* Supports multiple Report Display Selector Plugins on Multiple Interactive Grids on the same Page
* Supports Chart/Icon/Detail/Grid/All Views
* Supports Firefox, IE, Edge & Chrome

## How to use
Create a Page Load Dynamic Action.
Select IG Report Display Selector APEX Plugin as the true action
Set affected elements to a Interactive Grid Region

## Settings
You can find a detailed explanation in the help section of the plugin.

## Future developments
* Please let me know any of your wishes

