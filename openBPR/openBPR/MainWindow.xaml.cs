using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Forms;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using MahApps.Metro.Controls;
using Newtonsoft.Json.Linq;
using taskt.Core.Automation.Commands;
using taskt.UI.CustomControls;
using taskt.UI.Forms;
using WebSocketSharp;
using WebSocketSharp.Server;
using ListViewItem = System.Windows.Forms.ListViewItem;

namespace openBPR
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : MetroWindow
    {
       public static  ObservableCollection<steps> StepsCollection = new ObservableCollection<steps>();
       public static taskt.UI.CustomControls.UIListView lstScriptActions = new UIListView();
      


        public MainWindow()
        {
             InitializeComponent();
            dg_Step.DataContext = StepsCollection;
        }
        WebSocketServer wssv = null;

     

        private void btn_Stop_Click(object sender, RoutedEventArgs e)
        {
            wssv.Stop();

        }

        private void btn_Record_Click(object sender, RoutedEventArgs e)
        {
            if (wssv is null)
            {
                SeleniumBrowserCreateCommand createCommand = new SeleniumBrowserCreateCommand();
                createCommand.v_BrowserWindowOption = "Maximize";
                createCommand.v_InstanceName = "default";
                createCommand.v_EngineType = "Chrome";
                lstScriptActions.Items.Add(CreateScriptCommandListViewItem(createCommand));
                SeleniumBrowserNavigateURLCommand navigateUrlCommand = new SeleniumBrowserNavigateURLCommand();
                navigateUrlCommand.v_InstanceName = "default";
                navigateUrlCommand.v_URL = "";
                lstScriptActions.Items.Add(CreateScriptCommandListViewItem(navigateUrlCommand));
                wssv = new WebSocketServer("ws://localhost:8887/");

                wssv.AddWebSocketService<record>("/");

                wssv.Start();
            }
            else
            {
                if (wssv.IsListening)
                {
                    System.Windows.Forms.MessageBox.Show("A recording or spy session already open");
                }
            }
        }

        public  static System.Windows.Forms.ListViewItem CreateScriptCommandListViewItem(taskt.Core.Automation.Commands.ScriptCommand cmdDetails)
        {

            System.Windows.Forms.ListViewItem newCommand = new System.Windows.Forms.ListViewItem();

            newCommand.Text = cmdDetails.GetDisplayValue();
            newCommand.SubItems.Add(cmdDetails.GetDisplayValue());
            newCommand.SubItems.Add(cmdDetails.GetDisplayValue());
            //cmdDetails.RenderedControls = null;
            newCommand.Tag = cmdDetails;
            newCommand.ForeColor = cmdDetails.DisplayForeColor;
             return newCommand;
        }

        private void SaveToFile()
        {
            if (lstScriptActions.Items.Count == 0)
            {
                Console.WriteLine("You must have at least 1 automation command to save.");
                return;
            }

            int beginLoopValidationCount = 0;
            int beginIfValidationCount = 0;
            int tryCatchValidationCount = 0;
            foreach (ListViewItem item in lstScriptActions.Items)
            {
                if ((item.Tag is taskt.Core.Automation.Commands.BeginExcelDatasetLoopCommand) || (item.Tag is taskt.Core.Automation.Commands.BeginListLoopCommand) || (item.Tag is taskt.Core.Automation.Commands.BeginContinousLoopCommand) || (item.Tag is taskt.Core.Automation.Commands.BeginNumberOfTimesLoopCommand))
                {
                    beginLoopValidationCount++;
                }
                else if (item.Tag is taskt.Core.Automation.Commands.EndLoopCommand)
                {
                    beginLoopValidationCount--;
                }
                else if (item.Tag is taskt.Core.Automation.Commands.BeginIfCommand)
                {
                    beginIfValidationCount++;
                }
                else if (item.Tag is taskt.Core.Automation.Commands.EndIfCommand)
                {
                    beginIfValidationCount--;
                }
                else if (item.Tag is taskt.Core.Automation.Commands.TryCommand)
                {
                    tryCatchValidationCount++;
                }
                else if (item.Tag is taskt.Core.Automation.Commands.EndTryCommand)
                {
                    tryCatchValidationCount--;
                }

                if (tryCatchValidationCount < 0)
                {
                    Console.WriteLine("Please verify the ordering of your try/catch blocks.");
                    return;
                }

                //end loop was found first
                if (beginLoopValidationCount < 0)
                {
                    Console.WriteLine("Please verify the ordering of your loops.");
                    return;
                }

                //end if was found first
                if (beginIfValidationCount < 0)
                {
                    Console.WriteLine("Please verify the ordering of your ifs.");
                    return;
                }



            }

            //extras were found
            if (beginLoopValidationCount != 0)
            {
                Console.WriteLine("Please verify the ordering of your loops.");
                return;
            }
            //extras were found
            if (beginIfValidationCount != 0)
            {
                Console.WriteLine("Please verify the ordering of your ifs.");
                return;
            }

            if (tryCatchValidationCount != 0)
            {
                Console.WriteLine("Please verify the ordering of your try/catch blocks.");
                return;
            }

            //define default output path
           
                SaveFileDialog saveFileDialog = new SaveFileDialog();
                saveFileDialog.InitialDirectory = taskt.Core.IO.Folders.GetFolder(taskt.Core.IO.Folders.FolderType.ScriptsFolder);
                saveFileDialog.RestoreDirectory = true;
                saveFileDialog.Filter = "Xml (*.xml)|*.xml";

                if (saveFileDialog.ShowDialog() != System.Windows.Forms.DialogResult.OK)
                {
                    return;
                }

             

                // var fileName = Microsoft.VisualBasic.Interaction.InputBox("Please enter a file name (without extension)", "Enter File Name", "Default", -1, -1);



                //var rpaScriptsFolder = Core.Common.GetScriptFolderPath();

                //if (!System.IO.Directory.Exists(rpaScriptsFolder))
                //{
                //    UI.Forms.Supplemental.frmDialog userDialog = new UI.Forms.Supplemental.frmDialog("Would you like to create a folder to save your scripts in now? A script folder is required to save scripts generated with this application. The new script folder path would be '" + rpaScriptsFolder + "'.", "Unable to locate Script Folder!", UI.Forms.Supplemental.frmDialog.DialogType.YesNo, 0);

                //    if (userDialog.ShowDialog() == DialogResult.OK)
                //    {
                //        System.IO.Directory.CreateDirectory(rpaScriptsFolder);
                //    }
                //    else
                //    {
                //        return;
                //    }


                //}


                //this.ScriptFilePath = rpaScriptsFolder + fileName + ".xml";
            

            //serialize script
            try
            {
                var exportedScript = taskt.Core.Script.Script.SerializeScript(lstScriptActions.Items,null,  saveFileDialog.FileName);
                //show success dialog
                Console.WriteLine("File has been saved successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine("Er ror: " + ex.ToString());
            }


        }

        public class record : WebSocketBehavior
        {
           
            protected override void OnMessage(MessageEventArgs e)
            {
              
                Console.WriteLine(e.Data);
                JObject resp = JObject.Parse(e.Data);

                var command = new taskt.Core.Automation.Commands.SeleniumBrowserElementActionCommand();
                command.v_Comment = (string) resp.SelectToken("method") + " " +
                                         (string) resp.SelectToken("objectname") + " on " +
                                         (string) resp.SelectToken("page.title") + " page";

                command.v_WebActionParameterTable = new System.Data.DataTable
                {
                    TableName = "WebActionParamTable" + DateTime.Now.ToString("MMddyy.hhmmss")
                };
                command.v_WebActionParameterTable.Columns.Add("Parameter Name");
                command.v_WebActionParameterTable.Columns.Add("Parameter Value");

                string action = (string) resp.SelectToken("method");
                var props = resp.SelectToken("prop");
                // command.miscprops = new List<taskt.Core.KeyValuePair<string, string>>(7);
                var optional_props = new Dictionary<string, string>(7);
                if (!(props is null) && (!string.IsNullOrEmpty(props.ToString())))
                {
                    foreach (var prop in props)
                    {
                        JToken token = (JToken) prop;
                        if (!string.IsNullOrEmpty((string) token.SelectToken("val")))
                        {

                            optional_props.Add((string) token.SelectToken("prop"), (string) token.SelectToken("val"));
                        }

                     }

                }

                if (string.IsNullOrEmpty(action))
                {

                }

                if (action.Equals("Click"))
                {
                    command.v_SeleniumSearchType = "Find Element By XPath";
                    command.v_SeleniumElementAction = "Invoke Click";
                    command.v_SeleniumSearchParameter = (string) resp.SelectToken("prop[4].val");

                    var clickStep = new steps();
                    clickStep.id = command.CommandID;
                    clickStep.action = command.v_SeleniumElementAction;
                    clickStep.compid = command.v_SeleniumSearchParameter;

                    App.Current.Dispatcher.Invoke((System.Action)delegate
                    {
                        StepsCollection.Add(clickStep);
                        lstScriptActions.Items.Add(CreateScriptCommandListViewItem(command));
                    });
                


                    //assign cell as a combobox

                    //  SAPScriptRecoder.outputList.Add(command);

                }

                if (action.Equals("Set") || action.Equals("setEncrypted"))
                {


                    command.v_SeleniumSearchType = "Find Element By XPath";
                    command.v_SeleniumElementAction = "Set Text";
                    command.v_SeleniumSearchParameter = (string) resp.SelectToken("prop[4].val");
                    command.v_WebActionParameterTable.Rows.Add(new Object[]
                        {"Text To Set", (string) resp.SelectToken("input")});
                    command.v_WebActionParameterTable.Rows.Add(new Object[]
                        {"Clear Element Before Setting Text", "No"});
                    DataGridViewComboBoxCell comparisonComboBox = new DataGridViewComboBoxCell();
                    comparisonComboBox.Items.Add("Yes");
                    comparisonComboBox.Items.Add("No");

                

                }

                if (action.Equals("selectByVisibleText"))
                {
                    command.v_SeleniumSearchType = "Find Element By XPath";
                    command.v_SeleniumElementAction = "Select By Visible Text";
                    command.v_SeleniumSearchParameter = (string) resp.SelectToken("prop[4].val");
                    command.v_WebActionParameterTable.Rows.Add(new Object[]
                        {"Text To Set", (string) resp.SelectToken("input")});
                    command.v_WebActionParameterTable.Rows.Add(new Object[]
                        {"Clear Element Before Setting Text", "No"});
                    DataGridViewComboBoxCell comparisonComboBox = new DataGridViewComboBoxCell();
                    comparisonComboBox.Items.Add("Yes");
                    comparisonComboBox.Items.Add("No");
                  //  SAPScriptRecoder.outputList.Add(command);
                }

                if (action.Equals("SwitchTab"))
                {

                    if (!string.IsNullOrEmpty((string) resp.SelectToken("input")))
                    {
                        var switchWindowCommand = new taskt.Core.Automation.Commands.SeleniumBrowserSwitchWindowCommand();
                        switchWindowCommand.v_WindowMatchType = "Window Title";
                        switchWindowCommand.v_MatchSpecification = "Exact Match";
                        switchWindowCommand.v_MatchParameter = (string) resp.SelectToken("input");

                       
                    }

                }

                if (action.Equals("waitForPageLoaded"))
                {
                    var pausecommand = new taskt.Core.Automation.Commands.PauseCommand();
                    pausecommand.v_PauseLength = "10000";
                   // SAPScriptRecoder.outputList.Add(command);

                }

            }

            protected override void OnOpen()
            {
                JObject rss = new JObject(new JProperty("action", "startRecord"));
                Console.WriteLine("jobject is" + rss.ToString());

                Send(rss.ToString());
            }


        }

        private void btn_export_Click(object sender, RoutedEventArgs e)
        {
            SaveToFile();
        }
    }
}
